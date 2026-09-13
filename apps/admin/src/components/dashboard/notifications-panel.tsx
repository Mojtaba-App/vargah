import Link from 'next/link';

import {
  AlertTriangleIcon,
  BellAlertIcon,
  InfoIcon,
} from '@/components/dashboard/dashboard-icons';
import type { DashboardNotification } from '@/lib/dashboard-metrics';
import { cn } from '@/lib/utils';

const typeStyles = {
  info: {
    wrap: 'border-sky-500/30 bg-sky-500/5',
    icon: 'text-sky-600 dark:text-sky-400',
    Icon: InfoIcon,
  },
  warn: {
    wrap: 'border-amber-500/30 bg-amber-500/5',
    icon: 'text-amber-600 dark:text-amber-400',
    Icon: AlertTriangleIcon,
  },
  error: {
    wrap: 'border-rose-500/30 bg-rose-500/5',
    icon: 'text-rose-600 dark:text-rose-400',
    Icon: AlertTriangleIcon,
  },
} as const;

export function NotificationsPanel({ items }: { items: DashboardNotification[] }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-bold">اعلان‌های سیستمی</h2>
        <BellAlertIcon className="size-5 text-muted-foreground" />
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          اعلان فعالی وجود ندارد
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const style = typeStyles[item.type];
            const Icon = style.Icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-3 py-3 text-sm transition-colors hover:bg-muted/40',
                    style.wrap,
                  )}
                >
                  <Icon className={cn('mt-0.5 size-4 shrink-0', style.icon)} />
                  <span className="flex-1 font-medium leading-relaxed">{item.text}</span>
                  {item.unreadCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      {item.unreadCount.toLocaleString('fa-IR')}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
