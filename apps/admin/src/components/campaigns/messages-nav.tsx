'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/messages', label: 'صندوق ورودی', exact: true },
  { href: '/messages/chat', label: 'چت آنلاین', exact: false },
  { href: '/messages/campaigns', label: 'ارسال دسته‌ای', exact: false },
] as const;

export function MessagesNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-3">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
