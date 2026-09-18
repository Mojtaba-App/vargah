'use client';

import { UserRole } from '@vargah/database/enums';

import { GlobalSearch } from '@/components/layout/global-search';
import { NotificationBell } from '@/components/layout/notification-bell';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { TopbarUser } from '@/components/layout/topbar-user';
import type { AdminAlert } from '@/lib/admin-alerts';
import type { Permission } from '@/lib/permissions';

type TopbarProps = {
  user: {
    name: string;
    role: UserRole;
    avatar: string | null;
  };
  alerts: AdminAlert[];
  grantedPermissions: Permission[];
  onOpenMobileNav?: () => void;
};

export function Topbar({ user, alerts, grantedPermissions, onOpenMobileNav }: TopbarProps) {
  return (
    <header className="border-brand-200/70 bg-card/90 shadow-brand-900/5 dark:border-brand-800/50 dark:bg-card/85 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 shadow-sm backdrop-blur-xl sm:gap-4 sm:px-6 dark:shadow-black/20">
      <button
        type="button"
        className="border-border text-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-xl border lg:hidden"
        aria-label="باز کردن منو"
        onClick={onOpenMobileNav}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>
      <div className="min-w-0 flex-1">
        <GlobalSearch grantedPermissions={grantedPermissions} />
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <NotificationBell initialAlerts={alerts} />
        <TopbarUser user={user} />
      </div>
    </header>
  );
}
