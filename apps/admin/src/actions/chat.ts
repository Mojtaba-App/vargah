'use server';

import {
  AuditAction,
  ChatConversationStatus,
  ChatSenderType,
  prisma,
} from '@vargah/database';
import { sanitizePlainText } from '@vargah/security/sanitize';

import { recordAuditLog } from '@/lib/audit/record';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { getClientIp, verifyCsrfFromRequest } from '@/lib/security/request';
import { rateLimitOrThrow } from '@/lib/security/rate-limit';

const MAX_BODY_LENGTH = 2000;
const CHAT_POLL_LIMIT = 120;
const CHAT_POLL_WINDOW_MS = 15 * 60 * 1000;

export type AdminChatMessageDto = {
  id: string;
  senderType: 'GUEST' | 'AGENT' | 'SYSTEM';
  body: string;
  createdAt: string;
  agentName: string | null;
};

export type AdminChatConversationDto = {
  id: string;
  status: 'WAITING' | 'OPEN' | 'CLOSED';
  guestName: string;
  guestPhone: string;
  assignedToId: string | null;
  assigneeName: string | null;
  lastMessageAt: string;
  lastGuestMessageAt: string | null;
  createdAt: string;
  preview: string | null;
  messageCount: number;
};

function mapMessage(row: {
  id: string;
  senderType: ChatSenderType;
  body: string;
  createdAt: Date;
  senderUser: { name: string | null } | null;
}): AdminChatMessageDto {
  return {
    id: row.id,
    senderType: row.senderType,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    agentName: row.senderUser?.name ?? null,
  };
}

async function queryConversations(params?: {
  status?: 'ALL' | 'WAITING' | 'OPEN' | 'CLOSED';
  q?: string;
}): Promise<AdminChatConversationDto[]> {
  const status = params?.status ?? 'ALL';
  const q = params?.q?.trim();

  const rows = await prisma.chatConversation.findMany({
    where: {
      ...(status !== 'ALL' ? { status: status as ChatConversationStatus } : {}),
      ...(q
        ? {
            OR: [
              { guestName: { contains: q, mode: 'insensitive' } },
              { guestPhone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ lastMessageAt: 'desc' }],
    take: 100,
    include: {
      assignedTo: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true },
      },
      _count: { select: { messages: true } },
    },
  });

  const statusOrder = { WAITING: 0, OPEN: 1, CLOSED: 2 } as const;

  return rows
    .map((row) => ({
      id: row.id,
      status: row.status,
      guestName: row.guestName,
      guestPhone: row.guestPhone,
      assignedToId: row.assignedToId,
      assigneeName: row.assignedTo?.name ?? null,
      lastMessageAt: row.lastMessageAt.toISOString(),
      lastGuestMessageAt: row.lastGuestMessageAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      preview: row.messages[0]?.body ?? null,
      messageCount: row._count.messages,
    }))
    .sort((a, b) => {
      const byStatus = statusOrder[a.status] - statusOrder[b.status];
      if (byStatus !== 0) return byStatus;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
}

async function queryConversationDetail(id: string): Promise<{
  conversation: AdminChatConversationDto;
  messages: AdminChatMessageDto[];
} | null> {
  const row = await prisma.chatConversation.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      messages: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: 300,
        include: { senderUser: { select: { name: true } } },
      },
      _count: { select: { messages: true } },
    },
  });

  if (!row) return null;

  return {
    conversation: {
      id: row.id,
      status: row.status,
      guestName: row.guestName,
      guestPhone: row.guestPhone,
      assignedToId: row.assignedToId,
      assigneeName: row.assignedTo?.name ?? null,
      lastMessageAt: row.lastMessageAt.toISOString(),
      lastGuestMessageAt: row.lastGuestMessageAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      preview: row.messages[row.messages.length - 1]?.body ?? null,
      messageCount: row._count.messages,
    },
    messages: row.messages.map(mapMessage),
  };
}

export async function listChatConversations(params?: {
  status?: 'ALL' | 'WAITING' | 'OPEN' | 'CLOSED';
  q?: string;
}): Promise<AdminChatConversationDto[]> {
  await requirePermission(PERMISSIONS.CHAT_VIEW);
  return queryConversations(params);
}

export async function getChatConversationDetail(id: string): Promise<{
  conversation: AdminChatConversationDto;
  messages: AdminChatMessageDto[];
} | null> {
  await requirePermission(PERMISSIONS.CHAT_VIEW);
  return queryConversationDetail(id);
}

export async function pollChatInbox(params?: {
  status?: 'ALL' | 'WAITING' | 'OPEN' | 'CLOSED';
  q?: string;
  selectedId?: string | null;
  afterMessageId?: string | null;
}): Promise<{
  conversations: AdminChatConversationDto[];
  selected: {
    conversation: AdminChatConversationDto;
    messages: AdminChatMessageDto[];
  } | null;
  newMessages: AdminChatMessageDto[];
}> {
  const session = await requirePermission(PERMISSIONS.CHAT_VIEW);
  const ip = await getClientIp();
  await rateLimitOrThrow(`chat:poll:admin:${session.user.id}:${ip}`, CHAT_POLL_LIMIT, CHAT_POLL_WINDOW_MS);

  const conversations = await queryConversations({
    status: params?.status,
    q: params?.q,
  });

  let selected: {
    conversation: AdminChatConversationDto;
    messages: AdminChatMessageDto[];
  } | null = null;
  let newMessages: AdminChatMessageDto[] = [];

  if (params?.selectedId) {
    const detail = await queryConversationDetail(params.selectedId);
    selected = detail;

    if (detail && params.afterMessageId) {
      const anchor = detail.messages.find((m) => m.id === params.afterMessageId);
      if (anchor) {
        const anchorTime = new Date(anchor.createdAt).getTime();
        newMessages = detail.messages.filter((m) => {
          const t = new Date(m.createdAt).getTime();
          return t > anchorTime || (t === anchorTime && m.id > anchor.id);
        });
      } else {
        newMessages = detail.messages;
      }
    } else if (detail) {
      newMessages = detail.messages;
    }
  }

  return { conversations, selected, newMessages };
}

export async function replyToChat(conversationId: string, body: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CHAT_MANAGE);

  const text = sanitizePlainText(body).trim();
  if (text.length < 1) throw new Error('متن پاسخ خالی است.');
  if (text.length > MAX_BODY_LENGTH) throw new Error('پیام بیش از حد طولانی است.');

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, status: true, assignedToId: true },
  });
  if (!conversation) throw new Error('گفتگو یافت نشد.');
  if (conversation.status === ChatConversationStatus.CLOSED) {
    throw new Error('این گفتگو بسته شده است.');
  }

  const now = new Date();
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: {
        conversationId,
        senderType: ChatSenderType.AGENT,
        senderUserId: session.user.id,
        body: text,
      },
      include: { senderUser: { select: { name: true } } },
    });

    await tx.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: ChatConversationStatus.OPEN,
        lastMessageAt: now,
        assignedToId: conversation.assignedToId ?? session.user.id,
      },
    });

    return created;
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'ChatConversation',
    entityId: conversationId,
    changes: { replied: true },
  });

  return { message: mapMessage(message) };
}

export async function assignChat(conversationId: string, assignedToId: string | null) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CHAT_MANAGE);

  if (assignedToId) {
    const user = await prisma.user.findFirst({
      where: { id: assignedToId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!user) throw new Error('کاربر انتخاب‌شده معتبر نیست.');
  }

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: {
      assignedToId: assignedToId || null,
      ...(assignedToId
        ? { status: ChatConversationStatus.OPEN }
        : {}),
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'ChatConversation',
    entityId: conversationId,
    changes: { assignedToId },
  });

  return { ok: true as const };
}

export async function closeChat(conversationId: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CHAT_MANAGE);

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.chatMessage.create({
      data: {
        conversationId,
        senderType: ChatSenderType.SYSTEM,
        senderUserId: session.user.id,
        body: 'گفتگو توسط پشتیبانی بسته شد.',
      },
    });

    await tx.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: ChatConversationStatus.CLOSED,
        closedAt: now,
        lastMessageAt: now,
      },
    });
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'ChatConversation',
    entityId: conversationId,
    changes: { status: 'CLOSED' },
  });

  return { ok: true as const };
}

export async function reopenChat(conversationId: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CHAT_MANAGE);

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.chatMessage.create({
      data: {
        conversationId,
        senderType: ChatSenderType.SYSTEM,
        senderUserId: session.user.id,
        body: 'گفتگو دوباره باز شد.',
      },
    });

    await tx.chatConversation.update({
      where: { id: conversationId },
      data: {
        status: ChatConversationStatus.OPEN,
        closedAt: null,
        lastMessageAt: now,
        assignedToId: session.user.id,
      },
    });
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'ChatConversation',
    entityId: conversationId,
    changes: { status: 'OPEN', reopened: true },
  });

  return { ok: true as const };
}
