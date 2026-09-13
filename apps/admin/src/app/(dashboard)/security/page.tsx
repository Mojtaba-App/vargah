import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { SecurityWorkspace } from '@/components/security/security-workspace';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { buildDailyLoginSeries, calculateSecuritySummary } from '@/lib/security/summary';
import { PERMISSIONS, ADMIN_ROLES } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';

export default async function SecurityPage() {
  const session = await requireAuth();
  await requirePermission(PERMISSIONS.SECURITY_VIEW);

  const now = new Date();

  const [currentUser, sessions, loginAttempts, adminUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    }),
    prisma.userSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
    }),
    prisma.loginAttempt.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.user.findMany({
      where: { role: { in: ADMIN_ROLES } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
      },
      orderBy: [{ phone: 'asc' }, { name: 'asc' }],
    }),
  ]);

  const summary = calculateSecuritySummary(sessions, loginAttempts, adminUsers, now);
  const loginTrend = buildDailyLoginSeries(loginAttempts, 14, now);

  const sessionRows = sessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user.name ?? s.user.email ?? '—',
    userEmail: s.user.email,
    userRole: s.user.role,
    userAvatar: s.user.avatar,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    revokedAt: s.revokedAt,
    isCurrentUser: s.userId === session.user.id,
  }));

  const loginRows = loginAttempts.map((l) => ({
    id: l.id,
    userId: l.userId,
    email: l.email,
    success: l.success,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt,
  }));

  const adminRows = adminUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    lastLoginAt: u.lastLoginAt,
  }));

  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.SECURITY_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="امنیت پنل"
        description="تأیید پیامکی، نشست‌ها و لاگ ورود — پایش و مدیریت امنیت دسترسی"
      />
      <SecurityWorkspace
        summary={summary}
        loginTrend={loginTrend}
        sessions={sessionRows}
        loginAttempts={loginRows}
        adminUsers={adminRows}
        currentUserPhone={currentUser?.phone ?? null}
        currentUserId={session.user.id}
        canManage={canManage}
      />
    </div>
  );
}
