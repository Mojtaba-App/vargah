import { prisma } from '@vargah/database';

import { AuditWorkspace } from '@/components/users/audit-workspace';
import { PageHeader } from '@/components/ui/data-table';
import { PaginationLinks, parsePageParam } from '@/components/ui/pagination-links';
import { requirePermission } from '@/lib/auth-utils';
import { formatAuditMessage } from '@/lib/audit/messages';
import { isFullAccessRole, PERMISSIONS } from '@/lib/permissions';

const PAGE_SIZE = 100;

function dedupeOnlineUsers<
  T extends {
    id: string;
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      avatar: string | null;
      role: import('@vargah/database').UserRole;
    };
  },
>(sessions: T[]) {
  const map = new Map<string, T>();
  for (const session of sessions) {
    const existing = map.get(session.userId);
    if (!existing || session.createdAt > existing.createdAt) {
      map.set(session.userId, session);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditPage({ searchParams }: PageProps) {
  const session = await requirePermission(PERMISSIONS.AUDIT_VIEW);
  const isSuperAdmin = isFullAccessRole(session.user.role);
  const now = new Date();
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const skip = (page - 1) * PAGE_SIZE;
  const logWhere = isSuperAdmin ? undefined : { userId: session.user.id };

  const [total, logs, activeSessions] = await Promise.all([
    prisma.auditLog.count({ where: logWhere }),
    prisma.auditLog.findMany({
      where: logWhere,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        userId: true,
        action: true,
        entity: true,
        entityId: true,
        changes: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    }),
    isSuperAdmin
      ? prisma.userSession.findMany({
          where: {
            expiresAt: { gt: now },
            revokedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            userId: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const onlineBase = dedupeOnlineUsers(activeSessions);
  const onlineUserIds = onlineBase.map((entry) => entry.userId);

  const latestByUser = new Map<string, (typeof logs)[number]>();
  if (onlineUserIds.length > 0) {
    for (const log of logs) {
      const uid = log.userId ?? log.user?.id;
      if (!uid || !onlineUserIds.includes(uid)) continue;
      if (!latestByUser.has(uid)) latestByUser.set(uid, log);
    }
  }

  const onlineUsers = onlineBase.map((entry) => {
    const latest = latestByUser.get(entry.userId);
    return {
      sessionId: entry.id,
      userId: entry.userId,
      name: entry.user.name,
      email: entry.user.email,
      avatar: entry.user.avatar,
      role: entry.user.role,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      lastSeenAt: entry.createdAt.toISOString(),
      recentAction: latest
        ? formatAuditMessage({
            action: latest.action,
            entity: latest.entity,
            changes: latest.changes,
          })
        : null,
    };
  });

  const serializedLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    changes: log.changes,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
    user: log.user,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSuperAdmin ? 'لاگ فعالیت' : 'فعالیت‌های من'}
        description={
          isSuperAdmin
            ? 'پیگیری فعالیت کاربران — چه کسی، چه زمانی و از کجا تغییر داده است'
            : 'تاریخچه فعالیت‌های ثبت‌شده برای حساب شما'
        }
        backHref="/users"
        backLabel="بازگشت به کاربران"
      />
      <AuditWorkspace
        logs={serializedLogs}
        onlineUsers={onlineUsers}
        showOnlineUsers={isSuperAdmin}
      />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        total={total}
        basePath="/users/audit"
        searchParams={params}
      />
    </div>
  );
}
