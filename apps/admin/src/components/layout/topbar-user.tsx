'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@vargah/database/enums';

import { UserAvatar } from '@/components/layout/user-avatar';
import { ROLE_LABELS } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type TopbarUserProps = {
  user: {
    name: string;
    role: UserRole;
    avatar: string | null;
  };
};

export function TopbarUser({ user }: TopbarUserProps) {
  const pathname = usePathname();
  const isProfileActive = pathname === '/profile';

  return (
    <Link
      href="/profile"
      aria-current={isProfileActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors',
        isProfileActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:bg-muted/80',
      )}
    >
      <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
      <span className="hidden min-w-0 sm:block">
        <span className="block truncate text-sm font-bold leading-tight">{user.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {ROLE_LABELS[user.role]}
        </span>
      </span>
    </Link>
  );
}
