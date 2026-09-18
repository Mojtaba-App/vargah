'use server';

import { ChatConversationStatus, ChatSenderType, prisma } from '@vargah/database';

import { requireCustomerSession } from '@/actions/customer-auth';
import { getGuestChatToken, hashGuestChatToken } from '@/lib/chat/session';
import { CUSTOMER_TICKET_PRIORITIES } from '@/lib/profile/form-schemas';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'باز',
  IN_PROGRESS: 'در حال پیگیری',
  WAITING_CUSTOMER: 'منتظر پاسخ شما',
  RESOLVED: 'حل‌شده',
  CLOSED: 'بسته',
};

export type CustomerNotice = {
  id: string;
  kind: 'ticket' | 'message';
  tag: 'تیکت' | 'پیام';
  title: string;
  preview: string;
  count: number;
  statusLabel: string | null;
  priorityLabel: string | null;
  href: string;
};

export type CustomerNotificationSummary = {
  notices: CustomerNotice[];
  ticketCount: number;
  messageCount: number;
  total: number;
};

const EMPTY: CustomerNotificationSummary = {
  notices: [],
  ticketCount: 0,
  messageCount: 0,
  total: 0,
};

type TicketReplyRow = {
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  body: string;
  createdAt: Date;
};

function priorityLabel(value: string): string | null {
  const match = CUSTOMER_TICKET_PRIORITIES.find((item) => item.value === value);
  if (!match) return value === 'URGENT' ? 'فوری' : null;
  return `${match.level.toLocaleString('fa-IR')} — ${match.label}`;
}

function preview(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

async function conversationFilter(phone: string) {
  const token = await getGuestChatToken();
  return {
    status: { not: ChatConversationStatus.CLOSED },
    OR: [{ guestPhone: phone }, ...(token ? [{ guestTokenHash: hashGuestChatToken(token) }] : [])],
  };
}

export async function getCustomerNotifications(): Promise<CustomerNotificationSummary> {
  const session = await requireCustomerSession().catch(() => null);
  if (!session || !process.env.DATABASE_URL) return EMPTY;

  try {
    const [replyRows, unreadMessages] = await Promise.all([
      prisma.$queryRaw<TicketReplyRow[]>`
        SELECT
          t.id AS "ticketId",
          t.subject AS subject,
          t.status::text AS status,
          t.priority::text AS priority,
          tr.body AS body,
          tr."createdAt" AS "createdAt"
        FROM "ticket_replies" tr
        INNER JOIN "tickets" t ON t.id = tr."ticketId"
        WHERE t."subscriberId" = ${session.subscriberId}
          AND tr."isInternal" = false
          AND tr."authorId" IS NOT NULL
          AND tr."customerReadAt" IS NULL
        ORDER BY tr."createdAt" DESC
        LIMIT 80
      `,
      prisma.chatMessage.findMany({
        where: {
          senderType: ChatSenderType.AGENT,
          readAt: null,
          conversation: await conversationFilter(session.phone),
        },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: { id: true, body: true, createdAt: true },
      }),
    ]);

    const tickets = new Map<
      string,
      { subject: string; status: string; priority: string; count: number; preview: string }
    >();
    for (const row of replyRows) {
      const current = tickets.get(row.ticketId);
      if (!current) {
        tickets.set(row.ticketId, {
          subject: row.subject,
          status: row.status,
          priority: row.priority,
          count: 1,
          preview: preview(row.body),
        });
      } else {
        current.count += 1;
      }
    }

    const ticketNotices: CustomerNotice[] = [...tickets.entries()]
      .slice(0, 6)
      .map(([id, ticket]) => ({
        id,
        kind: 'ticket',
        tag: 'تیکت',
        title: ticket.subject,
        preview:
          ticket.count > 1
            ? `${ticket.count.toLocaleString('fa-IR')} پاسخ خوانده‌نشده · ${ticket.preview}`
            : ticket.preview,
        count: ticket.count,
        statusLabel: TICKET_STATUS_LABELS[ticket.status] ?? null,
        priorityLabel: priorityLabel(ticket.priority),
        href: '/profile?tab=tickets',
      }));

    const messageNotice: CustomerNotice[] =
      unreadMessages.length === 0
        ? []
        : [
            {
              id: 'chat',
              kind: 'message',
              tag: 'پیام',
              title: 'گفتگوی آنلاین',
              preview: preview(unreadMessages[0]?.body ?? ''),
              count: unreadMessages.length,
              statusLabel: null,
              priorityLabel: null,
              href: '#chat',
            },
          ];

    const ticketCount = tickets.size;
    const messageCount = unreadMessages.length;

    return {
      notices: [...ticketNotices, ...messageNotice],
      ticketCount,
      messageCount,
      total: ticketCount + messageCount,
    };
  } catch {
    return EMPTY;
  }
}

export async function markCustomerTicketNotificationsRead() {
  await verifyCsrfFromRequest();
  const session = await requireCustomerSession();
  if (!process.env.DATABASE_URL) return { success: true as const };

  await prisma.$executeRaw`
    UPDATE "ticket_replies" AS tr
    SET "customerReadAt" = NOW()
    FROM "tickets" AS t
    WHERE tr."ticketId" = t.id
      AND t."subscriberId" = ${session.subscriberId}
      AND tr."isInternal" = false
      AND tr."authorId" IS NOT NULL
      AND tr."customerReadAt" IS NULL
  `;

  return { success: true as const };
}

export async function markCustomerChatNotificationsRead() {
  await verifyCsrfFromRequest();
  const session = await requireCustomerSession();
  if (!process.env.DATABASE_URL) return { success: true as const };

  await prisma.chatMessage.updateMany({
    where: {
      senderType: ChatSenderType.AGENT,
      readAt: null,
      conversation: await conversationFilter(session.phone),
    },
    data: { readAt: new Date() },
  });

  return { success: true as const };
}
