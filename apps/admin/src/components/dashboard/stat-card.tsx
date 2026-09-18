import type { ComponentType, SVGProps } from 'react';

import { TrendDownIcon, TrendUpIcon } from '@/components/dashboard/dashboard-icons';
import { cn, formatNumber } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  change?: number | null;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: 'default' | 'primary' | 'success' | 'warning';
};

const toneStyles = {
  default: 'bg-muted/60 text-foreground',
  primary: 'bg-primary/12 text-primary',
  success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
};

export function StatCard({
  title,
  value,
  hint,
  change,
  icon: Icon,
  tone = 'default',
}: StatCardProps) {
  const display = typeof value === 'number' ? formatNumber(value) : value;
  const hasChange = typeof change === 'number';
  const positive = hasChange && change >= 0;

  return (
    <article className="group border-border/80 bg-card relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md">
      <div
        className="bg-primary/5 pointer-events-none absolute -start-8 -top-8 size-24 rounded-full transition-transform group-hover:scale-110"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{display}</p>
          {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
          {hasChange && (
            <p
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-medium',
                positive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {positive ? (
                <TrendUpIcon className="size-3.5" />
              ) : (
                <TrendDownIcon className="size-3.5" />
              )}
              {positive ? '+' : ''}
              {formatNumber(change)}٪ نسبت به دوره قبل
            </p>
          )}
        </div>
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            toneStyles[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </article>
  );
}
