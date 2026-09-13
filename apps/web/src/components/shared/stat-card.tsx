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
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-brand-300 via-primary to-brand-600 opacity-90"
        aria-hidden="true"
      />
      <p className="text-3xl font-bold tabular-nums tracking-tight text-primary sm:text-4xl">
        {displayValue}
        {suffix && (
          <span className="ms-1 text-base font-medium text-muted-foreground sm:text-lg">{suffix}</span>
        )}
      </p>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
