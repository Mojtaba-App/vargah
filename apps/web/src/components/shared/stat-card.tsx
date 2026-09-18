import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: number | string;
  suffix?: string;
  className?: string;
};

export function StatCard({ label, value, suffix, className }: StatCardProps) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div
      className={cn(
        'surface-card group relative overflow-hidden rounded-2xl p-5 text-center sm:p-6',
        className,
      )}
    >
      <div
        className="from-brand-300 via-primary to-brand-600 absolute inset-x-0 top-0 h-1 bg-gradient-to-l opacity-90"
        aria-hidden="true"
      />
      <p className="text-primary text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
        {displayValue}
        {suffix && (
          <span className="text-muted-foreground ms-1 text-base font-medium sm:text-lg">
            {suffix}
          </span>
        )}
      </p>
      <p className="text-muted-foreground mt-2 text-sm font-medium">{label}</p>
    </div>
  );
}
