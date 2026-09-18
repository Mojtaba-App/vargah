import {
  ArticleStatus,
  ChatConversationStatus,
  CommentStatus,
  MessageStatus,
  PaymentStatus,
  prisma,
} from '@vargah/database';

import { PERMISSIONS, type Permission } from '@/lib/permissions';

export type AdminAlert = {
  id: string;
  text: string;
  href: string;
  type: 'info' | 'warn' | 'error';
  /** تعداد کل فعلی */
  count: number;
  /** تعداد جدید از آخرین مشاهده */
  unreadCount: number;
};

export type AdminAlertSnapshot = {
  id: string;
  count: number;
};

const ALERT_DEFINITIONS = [
  {
    id: 'messages',
    permission: PERMISSIONS.MESSAGE_VIEW,
    href: '/messages',
    type: 'info' as const,
    label: 'پیام جدید در انتظار پاسخ',
  },
  {
    id: 'live_chat',
    permission: PERMISSIONS.CHAT_VIEW,
    href: '/messages/chat',
    type: 'warn' as const,
    label: 'گفتگوی آنلاین فعال یا در انتظار',
  },
  {
    id: 'comments',
    permissions: [PERMISSIONS.ARTICLE_EDIT, PERMISSIONS.ARTICLE_PUBLISH],
    href: '/content/comments',
    type: 'info' as const,
    label: 'نظر در انتظار تأیید',
  },
  {
    id: 'articles',
    permissions: [PERMISSIONS.ARTICLE_EDIT, PERMISSIONS.ARTICLE_PUBLISH],
    href: '/content/articles',
    type: 'warn' as const,
    label: 'مقاله در صف تأیید تحریریه',
  },
  {
    id: 'payments',
    permission: PERMISSIONS.FINANCE_VIEW,
    href: '/finance',
    type: 'error' as const,
    label: 'پرداخت ناموفق نیاز به بررسی',
  },
] as const;

function canSeeAlert(permissions: Permission[], def: (typeof ALERT_DEFINITIONS)[number]): boolean {
  if ('permission' in def && def.permission) {
    return permissions.includes(def.permission);
  }
  if ('permissions' in def && def.permissions) {
    return def.permissions.some((p) => permissions.includes(p));
  }
  return false;
}

async function countAlert(defId: string): Promise<number> {
  switch (defId) {
    case 'messages':
      return prisma.message.count({ where: { status: MessageStatus.NEW } });
    case 'live_chat':
      return prisma.chatConversation.count({
        where: {
          status: { in: [ChatConversationStatus.WAITING, ChatConversationStatus.OPEN] },
        },
      });
    case 'comments':
      return prisma.articleComment
        .count({ where: { status: CommentStatus.PENDING } })
        .catch(() => 0);
    case 'articles':
      return prisma.article.count({
        where: { status: { in: [ArticleStatus.SUBMITTED, ArticleStatus.IN_REVIEW] } },
      });
    case 'payments':
      return prisma.payment.count({ where: { status: PaymentStatus.FAILED } });
    default:
      return 0;
  }
}

function buildAlertText(label: string, total: number, unread: number): string {
  if (unread > 0 && unread < total) {
    return `${unread} مورد جدید (${total.toLocaleString('fa-IR')} در کل) — ${label}`;
  }
  return `${total.toLocaleString('fa-IR')} ${label}`;
}

export async function getAdminAlerts(
  userId: string,
  permissions: Permission[],
): Promise<AdminAlert[]> {
  const visibleDefs = ALERT_DEFINITIONS.filter((def) => canSeeAlert(permissions, def));
  if (visibleDefs.length === 0) return [];

  const [counts, ackRows] = await Promise.all([
    Promise.all(visibleDefs.map((def) => countAlert(def.id))),
    prisma.adminAlertAck.findMany({
      where: {
        userId,
        alertKey: { in: visibleDefs.map((def) => def.id) },
      },
      select: { alertKey: true, seenCount: true },
    }),
  ]);

  const ackMap = new Map(ackRows.map((ack) => [ack.alertKey, ack.seenCount]));

  return visibleDefs
    .map((def, index) => {
      const count = counts[index] ?? 0;
      if (count <= 0) return null;

      const seenCount = ackMap.get(def.id) ?? 0;
      const unreadCount = Math.max(0, count - seenCount);

      return {
        id: def.id,
        href: def.href,
        type: def.type,
        count,
        unreadCount,
        text: buildAlertText(def.label, count, unreadCount),
      };
    })
    .filter(Boolean) as AdminAlert[];
}

export async function acknowledgeAdminAlerts(
  userId: string,
  snapshots: AdminAlertSnapshot[],
): Promise<void> {
  if (snapshots.length === 0) return;

  await prisma.$transaction(
    snapshots.map((snapshot) =>
      prisma.adminAlertAck.upsert({
        where: {
          userId_alertKey: { userId, alertKey: snapshot.id },
        },
        create: {
          userId,
          alertKey: snapshot.id,
          seenCount: snapshot.count,
        },
        update: {
          seenCount: snapshot.count,
        },
      }),
    ),
  );
}

/** مجموع اعلان‌های خوانده‌نشده — برای badge */
export function getAdminAlertUnreadCount(alerts: AdminAlert[]): number {
  return alerts.reduce((sum, alert) => sum + alert.unreadCount, 0);
}

/** @deprecated از getAdminAlertUnreadCount استفاده کنید */
export function getAdminAlertCount(alerts: AdminAlert[]): number {
  return getAdminAlertUnreadCount(alerts);
}

export function toAlertSnapshots(alerts: AdminAlert[]): AdminAlertSnapshot[] {
  return alerts.map((alert) => ({ id: alert.id, count: alert.count }));
}
