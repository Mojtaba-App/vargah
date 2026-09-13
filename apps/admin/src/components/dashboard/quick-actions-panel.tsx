import Link from 'next/link';

import {
  BookPlusIcon,
  ImageIcon,
  MessageIcon,
  PenSquareIcon,
} from '@/components/dashboard/dashboard-icons';
import type { DashboardQuickAction } from '@/lib/dashboard-metrics';
import { cn } from '@/lib/utils';

const iconMap = {
  '/content/articles/new': PenSquareIcon,
  '/content/issues/new': BookPlusIcon,
  '/messages': MessageIcon,
  '/content/media': ImageIcon,
} as const;

const toneStyles = {
  primary: 'border-primary/25 bg-primary/5 hover:bg-primary/10',
  accent: 'border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10',
  neutral: 'border-border bg-muted/20 hover:bg-muted/40',
};

export function QuickActionsPanel({ actions }: { actions: DashboardQuickAction[] }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <h2 className="mb-4 font-bold">میانبرهای سریع</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = iconMap[action.href as keyof typeof iconMap] ?? PenSquareIcon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'group flex items-start gap-3 rounded-xl border p-3 transition-colors',
                toneStyles[action.tone],
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/70 text-primary">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{action.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{action.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
