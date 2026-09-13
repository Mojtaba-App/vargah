'use server';

import { headers } from 'next/headers';
import {
  ChatConversationStatus,
  ChatSenderType,
  prisma,
} from '@vargah/database';
import { isValidIranPhone, normalizeIranPhone } from '@vargah/security/phone';
import { sanitizePlainText } from '@vargah/security/sanitize';
import { z } from 'zod';

import { rateLimitOrThrow } from '@/lib/rate-limit';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import {
  clearGuestChatCookie,
  createGuestChatToken,
  getGuestChatToken,
  hashGuestChatToken,
  setGuestChatCookie,
} from '@/lib/chat/session';

const CHAT_START_LIMIT = 5;
const CHAT_SEND_LIMIT = 30;
const CHAT_IP_START_LIMIT = 12;
const CHAT_IP_SEND_LIMIT = 60;
const CHAT_POLL_LIMIT = 90;
const CHAT_IP_POLL_LIMIT = 180;
const CHAT_WINDOW_MS = 15 * 60 * 1000;
const MAX_BODY_LENGTH = 2000;
const MAX_NAME_LENGTH = 80;

const FALLBACK_START = 'شروع گفتگو ممکن نشد. لطفاً اطلاعات را بررسی کنید.';
const FALLBACK_SEND = 'ارسال پیام ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.';
const RATE_LIMIT_MSG = 'تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید.';

export type ChatFieldKey = 'name' | 'phone' | 'message' | 'body';

export type ChatFieldErrors = Partial<Record<ChatFieldKey, string>>;

export type ChatActionFailure = {
  ok: false;
  message: string;
  fields?: ChatFieldErrors;
};

export type ChatMessageDto = {
  id: string;
  senderType: 'GUEST' | 'AGENT' | 'SYSTEM';
  body: string;
  createdAt: string;
  agentName: string | null;
};

export type ChatConversationDto = {
  id: string;
  status: 'WAITING' | 'OPEN' | 'CLOSED';
  guestName: string;
  guestPhone: string;
  createdAt: string;
  lastMessageAt: string;
};

const startSchema = z.object({
  name: z
    .string()
    .transform((value) => sanitizePlainText(value).trim())
    .pipe(
      z
        .string()
        .min(2, 'نام حداقل ۲ کاراکتر باشد.')
        .max(MAX_NAME_LENGTH, 'نام حداکثر ۸۰ کاراکتر باشد.'),
    ),
  phone: z
    .string()
    .transform((value) => value.trim())
    .superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'شماره موبایل لازم است.' });
        return;
      }
      if (!isValidIranPhone(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'شماره موبایل معتبر نیست. نمونه: 09123456789',
        });
      }
    })
    .transform((value) => normalizeIranPhone(value)),
  message: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const cleaned = sanitizePlainText(value).trim();
      return cleaned.length > 0 ? cleaned : undefined;
    })
    .refine((value) => value === undefined || value.length <= MAX_BODY_LENGTH, {
      message: 'پیام حداکثر ۲۰۰۰ کاراکتر باشد.',
    }),
});

function mapMessage(row: {
  id: string;
  senderType: ChatSenderType;
  body: string;
  createdAt: Date;
  senderUser: { name: string | null } | null;
}): ChatMessageDto {
  return {
    id: row.id,
    senderType: row.senderType,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    agentName: row.senderUser?.name ?? null,
  };
}

function fail(message: string, fields?: ChatFieldErrors): ChatActionFailure {
  return { ok: false, message, fields };
}

function zodFieldErrors(error: z.ZodError): ChatFieldErrors {
  const fields: ChatFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === 'name' || key === 'phone' || key === 'message' || key === 'body') {
      if (!fields[key]) fields[key] = issue.message;
    }
  }
  return fields;
}

function isPublicPersianMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (/^[A-Z][A-Z0-9_]+$/.test(trimmed)) return false;
  if (/zod|prisma|failed|invalid|error|exception|stack|csrf|token|sql/i.test(trimmed)) {
    return false;
  }
  return true;
}

async function getRequestIp(): Promise<string> {
  try {
    const hdrs = await headers();
    return (
      hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      hdrs.get('x-real-ip')?.trim() ||
      'anon'
    );
  } catch {
    return 'anon';
  }
}

async function assertChatRateLimit(key: string, limit: number): Promise<ChatActionFailure | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    await rateLimitOrThrow(key, limit, CHAT_WINDOW_MS);
    return null;
  } catch {
    return fail(RATE_LIMIT_MSG);
  }
}

async function resolveGuestConversation() {
  const token = await getGuestChatToken();
  if (!token) return null;

  const conversation = await prisma.chatConversation.findUnique({
    where: { guestTokenHash: hashGuestChatToken(token) },
    select: {
      id: true,
      status: true,
      guestName: true,
      guestPhone: true,
      createdAt: true,
      lastMessageAt: true,
    },
  });

  if (!conversation) {
    await clearGuestChatCookie();
    return null;
  }

  return conversation;
}

export async function getGuestChatState(): Promise<{
  conversation: ChatConversationDto | null;
  messages: ChatMessageDto[];
}> {
  if (!process.env.DATABASE_URL) {
    return { conversation: null, messages: [] };
  }

  try {
    const conversation = await resolveGuestConversation();
    if (!conversation) {
      return { conversation: null, messages: [] };
    }

    if (conversation.status === ChatConversationStatus.CLOSED) {
      await clearGuestChatCookie();
      return { conversation: null, messages: [] };
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { senderUser: { select: { name: true } } },
    });

    return {
      conversation: {
        id: conversation.id,
        status: conversation.status,
        guestName: conversation.guestName,
        guestPhone: conversation.guestPhone,
        createdAt: conversation.createdAt.toISOString(),
        lastMessageAt: conversation.lastMessageAt.toISOString(),
      },
      messages: messages.map(mapMessage),
    };
  } catch {
    return { conversation: null, messages: [] };
  }
}

export async function startGuestChat(input: {
  name: string;
  phone: string;
  message?: string;
}): Promise<
  | { ok: true; conversation: ChatConversationDto; messages: ChatMessageDto[] }
  | ChatActionFailure
> {
  await verifyCsrfFromRequest();
  const parsed = startSchema.safeParse({
    name: input.name ?? '',
    phone: input.phone ?? '',
    message: input.message?.trim() ? input.message : undefined,
  });

  if (!parsed.success) {
    const fields = zodFieldErrors(parsed.error);
    const message =
      fields.name ||
      fields.phone ||
      fields.message ||
      'لطفاً نام و شماره موبایل را درست وارد کنید.';
    return fail(message, fields);
  }

  const ip = await getRequestIp();
  const ipLimit = await assertChatRateLimit(`chat:start:ip:${ip}`, CHAT_IP_START_LIMIT);
  if (ipLimit) return ipLimit;

  const phoneLimit = await assertChatRateLimit(
    `chat:start:phone:${parsed.data.phone}`,
    CHAT_START_LIMIT,
  );
  if (phoneLimit) return phoneLimit;

  try {
    const existing = await resolveGuestConversation();
    if (existing && existing.status !== ChatConversationStatus.CLOSED) {
      const state = await getGuestChatState();
      if (state.conversation) {
        return { ok: true, conversation: state.conversation, messages: state.messages };
      }
    }

    const { token, tokenHash } = createGuestChatToken();
    const now = new Date();
    const firstMessage = parsed.data.message?.trim() || '';

    const conversation = await prisma.chatConversation.create({
      data: {
        guestName: parsed.data.name,
        guestPhone: parsed.data.phone,
        guestTokenHash: tokenHash,
        status: ChatConversationStatus.WAITING,
        lastMessageAt: now,
        lastGuestMessageAt: firstMessage ? now : null,
        messages: firstMessage
          ? {
              create: {
                senderType: ChatSenderType.GUEST,
                body: firstMessage.slice(0, MAX_BODY_LENGTH),
              },
            }
          : {
              create: {
                senderType: ChatSenderType.SYSTEM,
                body: 'گفتگو آغاز شد. کارشناسان ما به‌زودی پاسخ می‌دهند.',
              },
            },
      },
      select: {
        id: true,
        status: true,
        guestName: true,
        guestPhone: true,
        createdAt: true,
        lastMessageAt: true,
      },
    });

    await setGuestChatCookie(token);

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      include: { senderUser: { select: { name: true } } },
    });

    return {
      ok: true,
      conversation: {
        id: conversation.id,
        status: conversation.status,
        guestName: conversation.guestName,
        guestPhone: conversation.guestPhone,
        createdAt: conversation.createdAt.toISOString(),
        lastMessageAt: conversation.lastMessageAt.toISOString(),
      },
      messages: messages.map(mapMessage),
    };
  } catch (error) {
    if (error instanceof Error && isPublicPersianMessage(error.message)) {
      return fail(error.message);
    }
    return fail(FALLBACK_START);
  }
}

export async function sendGuestChatMessage(
  body: string,
): Promise<{ ok: true; message: ChatMessageDto } | ChatActionFailure> {
  await verifyCsrfFromRequest();
  const text = sanitizePlainText(body ?? '').trim();
  if (text.length < 1) {
    return fail('متن پیام خالی است.', { body: 'لطفاً پیام خود را بنویسید.' });
  }
  if (text.length > MAX_BODY_LENGTH) {
    return fail('پیام بیش از حد طولانی است.', {
      body: 'پیام حداکثر ۲۰۰۰ کاراکتر باشد.',
    });
  }

  try {
    const conversation = await resolveGuestConversation();
    if (!conversation || conversation.status === ChatConversationStatus.CLOSED) {
      await clearGuestChatCookie();
      return fail('گفتگو فعال نیست. لطفاً دوباره شروع کنید.');
    }

    const ip = await getRequestIp();
    const ipLimit = await assertChatRateLimit(`chat:send:ip:${ip}`, CHAT_IP_SEND_LIMIT);
    if (ipLimit) return ipLimit;

    const sendLimit = await assertChatRateLimit(
      `chat:send:${conversation.id}`,
      CHAT_SEND_LIMIT,
    );
    if (sendLimit) return sendLimit;

    const now = new Date();
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderType: ChatSenderType.GUEST,
          body: text,
        },
        include: { senderUser: { select: { name: true } } },
      });

      await tx.chatConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: now,
          lastGuestMessageAt: now,
          status:
            conversation.status === ChatConversationStatus.CLOSED
              ? ChatConversationStatus.WAITING
              : conversation.status,
        },
      });

      return created;
    });

    return { ok: true, message: mapMessage(message) };
  } catch (error) {
    if (error instanceof Error && isPublicPersianMessage(error.message)) {
      return fail(error.message);
    }
    return fail(FALLBACK_SEND);
  }
}

export async function pollGuestChatMessages(afterId?: string | null): Promise<{
  conversation: ChatConversationDto | null;
  messages: ChatMessageDto[];
  closed: boolean;
}> {
  if (!process.env.DATABASE_URL) {
    return { conversation: null, messages: [], closed: false };
  }

  try {
    const ip = await getRequestIp();
    const ipLimit = await assertChatRateLimit(`chat:poll:ip:${ip}`, CHAT_IP_POLL_LIMIT);
    if (ipLimit) {
      return { conversation: null, messages: [], closed: false };
    }

    const conversation = await resolveGuestConversation();
    if (!conversation) {
      return { conversation: null, messages: [], closed: false };
    }

    const pollLimit = await assertChatRateLimit(
      `chat:poll:${conversation.id}`,
      CHAT_POLL_LIMIT,
    );
    if (pollLimit) {
      return { conversation: null, messages: [], closed: false };
    }

    if (conversation.status === ChatConversationStatus.CLOSED) {
      await clearGuestChatCookie();
      return { conversation: null, messages: [], closed: true };
    }

    let messages;
    if (afterId) {
      const anchor = await prisma.chatMessage.findFirst({
        where: { id: afterId, conversationId: conversation.id },
        select: { id: true, createdAt: true },
      });

      messages = anchor
        ? await prisma.chatMessage.findMany({
            where: {
              conversationId: conversation.id,
              OR: [
                { createdAt: { gt: anchor.createdAt } },
                { AND: [{ createdAt: anchor.createdAt }, { id: { gt: anchor.id } }] },
              ],
            },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            take: 100,
            include: { senderUser: { select: { name: true } } },
          })
        : await prisma.chatMessage.findMany({
            where: { conversationId: conversation.id },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            take: 200,
            include: { senderUser: { select: { name: true } } },
          });
    } else {
      messages = await prisma.chatMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: 200,
        include: { senderUser: { select: { name: true } } },
      });
    }

    return {
      conversation: {
        id: conversation.id,
        status: conversation.status,
        guestName: conversation.guestName,
        guestPhone: conversation.guestPhone,
        createdAt: conversation.createdAt.toISOString(),
        lastMessageAt: conversation.lastMessageAt.toISOString(),
      },
      messages: messages.map(mapMessage),
      closed: false,
    };
  } catch {
    return { conversation: null, messages: [], closed: false };
  }
}

export async function endGuestChatSession(): Promise<{ ok: true }> {
  await verifyCsrfFromRequest();

  try {
    const conversation = await resolveGuestConversation();
    if (conversation && conversation.status !== ChatConversationStatus.CLOSED) {
      const now = new Date();
      await prisma.$transaction(async (tx) => {
        await tx.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderType: ChatSenderType.SYSTEM,
            body: 'گفتگو توسط مهمان پایان یافت.',
          },
        });
        await tx.chatConversation.update({
          where: { id: conversation.id },
          data: {
            status: ChatConversationStatus.CLOSED,
            closedAt: now,
            lastMessageAt: now,
          },
        });
      });
    }
  } catch {
    /* بستن کوکی حتی در خطای DB */
  }

  await clearGuestChatCookie();
  return { ok: true };
}
