'use client';

import { useCallback, useMemo, useTransition } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { cn, formatNumber } from '@/lib/utils';
import { JALALI_MONTHS, formatJalaliMonthLabel } from '@/lib/issues-archive';

type IssueFilterProps = {
  years: number[];
  yearCounts: Record<number, number>;
  totalCount: number;
  filteredCount: number;
  selectedYear?: number;
  selectedMonth?: number;
  className?: string;
};

export function IssueFilter({
  years,
  yearCounts,
  totalCount,
  filteredCount,
  selectedYear,
  selectedMonth,
  className,
}: IssueFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const hasFilter = Boolean(selectedYear || selectedMonth);

  const pushFilters = useCallback(
    (year?: number, month?: number) => {
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));
      if (month) params.set('month', String(month));
      const query = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
      });
    },
    [pathname, router],
  );

  const selectYear = (year?: number) => {
    if (!year) {
      pushFilters(undefined, undefined);
      return;
    }
    if (selectedYear === year) {
      pushFilters(undefined, undefined);
      return;
    }
    pushFilters(year, undefined);
  };

  const selectMonth = (month: number) => {
    if (!selectedYear) return;
    pushFilters(selectedYear, selectedMonth === month ? undefined : month);
  };

  const clearFilters = () => pushFilters();

  const activeLabel = useMemo(() => {
    if (!selectedYear && !selectedMonth) return null;
    const parts: string[] = [];
    if (selectedYear) parts.push(String(selectedYear));
    if (selectedMonth) parts.push(formatJalaliMonthLabel(selectedMonth));
    return parts.join(' — ');
  }, [selectedYear, selectedMonth]);

  return (
    <section
      className={cn(
        'border-border/80 bg-card/80 rounded-2xl border p-4 shadow-sm backdrop-blur-sm sm:p-6',
        isPending && 'opacity-80',
        className,
      )}
      aria-busy={isPending}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">فیلتر آرشیو</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {hasFilter
              ? `${formatNumber(filteredCount)} شماره از ${formatNumber(totalCount)}`
              : `${formatNumber(totalCount)} شماره منتشرشده`}
          </p>
        </div>
        {hasFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="border-border hover:bg-muted rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            پاک کردن فیلترها
          </button>
        )}
      </div>

      {activeLabel && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">فعال:</span>
          <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
            {activeLabel}
          </span>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <p className="text-muted-foreground mb-3 text-sm font-medium">سال انتشار</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!selectedYear} onClick={() => selectYear(undefined)}>
              همه
            </FilterChip>
            {years.map((year) => (
              <FilterChip
                key={year}
                active={selectedYear === year}
                onClick={() => selectYear(year)}
              >
                {year}
                <span className="ms-1 opacity-70">({formatNumber(yearCounts[year] ?? 0)})</span>
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mb-3 text-sm font-medium">ماه انتشار</p>
          {!selectedYear ? (
            <p className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm">
              برای فیلتر ماهانه، ابتدا یک سال را انتخاب کنید.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {JALALI_MONTHS.map((label, index) => {
                const month = index + 1;
                return (
                  <FilterChip
                    key={label}
                    active={selectedMonth === month}
                    onClick={() => selectMonth(month)}
                    className="justify-center px-2 py-2 text-xs sm:text-sm"
                  >
                    {label}
                  </FilterChip>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  className,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50',
        className,
      )}
    >
      {children}
    </button>
  );
}
