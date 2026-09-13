import { prisma } from '@vargah/database';

import { requireAuth } from '@/lib/auth-utils';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SessionRefresh } from '@/components/security/session-refresh';
import { CsrfFetchInit } from '@/components/security/csrf-fetch-init';
import { getSiteConfig } from '@/lib/site-config';
import { getPermissionsForRole } from '@/lib/permissions-server';
import { getAdminAlerts } from '@/lib/admin-alerts';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const grantedPermissions = await getPermissionsForRole(session.user.role);

  const [user, siteConfig, alerts] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { name: true, role: true, avatar: true },
    }),
    getSiteConfig(),
    getAdminAlerts(session.user.id, grantedPermissions),
  ]);

  return (
    <DashboardShell
      user={{
        name: user.name ?? 'کاربر',
        role: user.role,
        avatar: user.avatar,
      }}
      branding={{
        siteName: siteConfig.branding.siteName,
        adminLogo: siteConfig.branding.adminLogo,
      }}
      grantedPermissions={grantedPermissions}
      alerts={alerts}
    >
      <SessionRefresh />
      <CsrfFetchInit />
      {children}
    </DashboardShell>
  );
}
