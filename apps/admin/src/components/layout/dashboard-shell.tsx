'use client';

import { useEffect, useState } from 'react';
import { UserRole } from '@vargah/database/enums';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { cn } from '@/lib/utils';
import type { AdminAlert } from '@/lib/admin-alerts';
import type { Permission } from '@/lib/permissions';

type DashboardUser = {
  name: string;
  role: UserRole;
  avatar: string | null;
};

type DashboardShellProps = {
  children: React.ReactNode;
  user: DashboardUser;
  branding: {
    siteName: string;
    adminLogo: string;
  };
  grantedPermissions?: Permission[];
  alerts?: AdminAlert[];
};

export function DashboardShell({ children, user, branding, grantedPermissions, alerts = [] }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--brand-400)_8%,transparent),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--brand-400)_12%,transparent),transparent_50%)]" dir="rtl">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="بستن منو"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <Sidebar
        role={user.role}
        grantedPermissions={grantedPermissions}
        branding={branding}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div
        className={cn(
          'transition-all duration-300',
          'ms-0',
          collapsed ? 'lg:ms-[4.25rem]' : 'lg:ms-64',
        )}
      >
        <Topbar
          user={user}
          alerts={alerts}
          grantedPermissions={grantedPermissions ?? []}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
