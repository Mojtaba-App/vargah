'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { DataTable } from '@/components/ui/data-table';
import { WorkspaceSearchField } from '@/components/ui/workspace-search-field';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getScoreBadgeTone, NPS_SCORE_LABELS, type NpsSegmentFilter } from '@/lib/crm/surveys/constants';
import {
  classifyNpsScore,
  computeNpsMetrics,
  formatNpsScore,
  getNpsScoreTone,
  NPS_SEGMENT_LABELS,
  type NpsSegment,
} from '@/lib/crm/surveys/nps';
import { cn, formatJalali, formatNumber } from '@/lib/utils';

export type SurveyRow = {
  id: string;
  score: number;
  comment: string | null;
  customerName: string | null;
  createdAt: Date;
  ticketId: string | null;
  ticketSubject: string | null;
};

type SurveysWorkspaceProps = {
  surveys: SurveyRow[];
};

const NPS_TONE_STYLES = {
  excellent: 'text-emerald-600 dark:text-emerald-400',
  good: 'text-sky-600 dark:text-sky-400',
  fair: 'text-amber-600 dark:text-amber-400',
  poor: 'text-rose-600 dark:text-rose-400',
  empty: 'text-muted-foreground',
} as const;

const SEGMENT_BADGE: Record<NpsSegment, 'default' | 'secondary' | 'destructive'> = {
  promoter: 'default',
  passive: 'secondary',
  detractor: 'destructive',
};

const SCORE_BADGE_CLASS: Record<'promoter' | 'passive' | 'detractor', string> = {
  promoter: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  passive: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  detractor: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

function MetricCard({
  label,
  value,
  hint,
  tone = 'empty',
  active,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof NPS_TONE_STYLES;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 text-start transition-colors',
        onClick && 'cursor-pointer hover:border-primary/40 hover:bg-muted/30',
        active && 'border-primary ring-1 ring-primary/20',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', NPS_TONE_STYLES[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Comp>
  );
}

function ScoreDistribution({ distribution, total }: { distribution: ReturnType<typeof computeNpsMetrics>['distribution']; total: number }) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 pt-6">
        <div>
          <h3 className="font-semibold">توزیع امتیازها</h3>
          <p className="text-sm text-muted-foreground">از ۰ تا ۱۰ — {formatNumber(total)} پاسخ</p>
        </div>
        <div className="flex items-end justify-between gap-1 sm:gap-2" style={{ minHeight: '8rem' }}>
          {distribution.map((item) => {
            const tone = getScoreBadgeTone(item.score);
            const heightPct = total > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <div key={item.score} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] tabular-nums text-muted-foreground sm:text-xs">
                  {item.count > 0 ? formatNumber(item.count) : ''}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={cn(
                      'w-full rounded-t-md transition-all',
                      tone === 'promoter' && 'bg-emerald-500/70',
                      tone === 'passive' && 'bg-amber-500/70',
                      tone === 'detractor' && 'bg-rose-500/70',
                    )}
                    style={{ height: `${Math.max(heightPct, item.count > 0 ? 8 : 2)}%`, minHeight: item.count > 0 ? '0.5rem' : '2px' }}
                    title={`امتیاز ${item.score}: ${item.count} پاسخ (${item.pct.toFixed(0)}٪)`}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums">{item.score}</span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500/70" />
            مروج (۹–۱۰)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500/70" />
            خنثی (۷–۸)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500/70" />
            منتقد (۰–۶)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SegmentBreakdown({
  promoters,
  passives,
  detractors,
  promoterPct,
  passivePct,
  detractorPct,
}: Pick<
  ReturnType<typeof computeNpsMetrics>,
  'promoters' | 'passives' | 'detractors' | 'promoterPct' | 'passivePct' | 'detractorPct'
>) {
  const segments: { key: NpsSegment; count: number; pct: number; color: string }[] = [
    { key: 'promoter', count: promoters, pct: promoterPct, color: 'bg-emerald-500' },
    { key: 'passive', count: passives, pct: passivePct, color: 'bg-amber-500' },
    { key: 'detractor', count: detractors, pct: detractorPct, color: 'bg-rose-500' },
  ];

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 pt-6">
        <div>
          <h3 className="font-semibold">ترکیب پاسخ‌دهندگان</h3>
          <p className="text-sm text-muted-foreground">طبقه‌بندی استاندارد NPS</p>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {segments.map((seg) =>
            seg.pct > 0 ? (
              <div
                key={seg.key}
                className={cn('transition-all', seg.color)}
                style={{ width: `${seg.pct}%` }}
                title={`${NPS_SEGMENT_LABELS[seg.key]}: ${seg.pct.toFixed(0)}٪`}
              />
            ) : null,
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {segments.map((seg) => (
            <div key={seg.key} className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{NPS_SEGMENT_LABELS[seg.key]}</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatNumber(seg.count)}</p>
              <p className="text-xs text-muted-foreground">{seg.pct.toFixed(0)}٪</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SurveysWorkspace({ surveys }: SurveysWorkspaceProps) {
  const [segmentFilter, setSegmentFilter] = useState<NpsSegmentFilter>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const metrics = useMemo(() => computeNpsMetrics(surveys.map((s) => s.score)), [surveys]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return surveys.filter((survey) => {
      if (segmentFilter !== 'ALL' && classifyNpsScore(survey.score) !== segmentFilter) return false;
      if (!q) return true;
      const haystack = [
        survey.customerName ?? '',
        survey.comment ?? '',
        survey.ticketSubject ?? '',
        String(survey.score),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [surveys, segmentFilter, debouncedSearch]);

  const columns = useMemo<ColumnDef<SurveyRow>[]>(
    () => [
      {
        accessorKey: 'score',
        header: 'امتیاز',
        cell: ({ row }) => {
          const score = row.original.score;
          const tone = getScoreBadgeTone(score);
          return (
            <div className="space-y-1">
              <span
                className={cn(
                  'inline-flex min-w-[2.5rem] items-center justify-center rounded-lg border px-2 py-1 text-sm font-bold tabular-nums',
                  SCORE_BADGE_CLASS[tone],
                )}
              >
                {score}
              </span>
              <p className="text-[10px] text-muted-foreground">{NPS_SCORE_LABELS[score]}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'customerName',
        header: 'مشتری',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.customerName ?? '—'}</span>
        ),
      },
      {
        id: 'segment',
        header: 'دسته',
        cell: ({ row }) => {
          const segment = classifyNpsScore(row.original.score);
          return <Badge variant={SEGMENT_BADGE[segment]}>{NPS_SEGMENT_LABELS[segment]}</Badge>;
        },
      },
      {
        id: 'ticket',
        header: 'تیکت',
        cell: ({ row }) => {
          const { ticketId, ticketSubject } = row.original;
          if (!ticketId) return <span className="text-muted-foreground">—</span>;
          return (
            <Link
              href={`/crm/tickets/${ticketId}`}
              className="line-clamp-2 text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {ticketSubject ?? 'مشاهده تیکت'}
            </Link>
          );
        },
      },
      {
        accessorKey: 'comment',
        header: 'نظر',
        cell: ({ row }) => (
          <p className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
            {row.original.comment ?? '—'}
          </p>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'تاریخ',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">{formatJalali(row.original.createdAt, true)}</span>
        ),
      },
    ],
    [],
  );

  const npsTone = getNpsScoreTone(metrics.npsScore);
  const averageLabel =
    metrics.average !== null ? `${metrics.average.toFixed(1)} از ۱۰` : '— از ۱۰';

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="امتیاز NPS"
          value={formatNpsScore(metrics.npsScore)}
          hint="مروج − منتقد (٪)"
          tone={npsTone}
        />
        <MetricCard
          label="میانگین امتیاز"
          value={metrics.average !== null ? metrics.average.toFixed(1) : '—'}
          hint={averageLabel}
          tone={metrics.average !== null && metrics.average >= 8 ? 'excellent' : metrics.average !== null && metrics.average >= 6 ? 'good' : 'empty'}
        />
        <MetricCard
          label="کل پاسخ‌ها"
          value={formatNumber(metrics.total)}
          hint={metrics.total === 0 ? 'هنوز پاسخی ثبت نشده' : `${formatNumber(filtered.length)} در نمای فعلی`}
        />
        <MetricCard
          label="مروج / منتقد"
          value={metrics.total > 0 ? `${formatNumber(metrics.promoters)} / ${formatNumber(metrics.detractors)}` : '—'}
          hint={metrics.total > 0 ? `${metrics.promoterPct.toFixed(0)}٪ مروج — ${metrics.detractorPct.toFixed(0)}٪ منتقد` : undefined}
        />
      </div>

      {metrics.total > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ScoreDistribution distribution={metrics.distribution} total={metrics.total} />
          <SegmentBreakdown
            promoters={metrics.promoters}
            passives={metrics.passives}
            detractors={metrics.detractors}
            promoterPct={metrics.promoterPct}
            passivePct={metrics.passivePct}
            detractorPct={metrics.detractorPct}
          />
        </div>
      ) : (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-2xl">📊</div>
            <div>
              <p className="font-semibold">هنوز پاسخی برای رضایت‌سنجی ثبت نشده</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                پس از بسته شدن تیکت‌ها، می‌توانید از مشتریان امتیاز NPS (۰ تا ۱۰) دریافت کنید.
              </p>
            </div>
            <Link href="/crm/tickets" className="text-sm text-primary hover:underline">
              رفتن به تیکت‌ها
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="font-semibold">لیست پاسخ‌ها</h3>
              <p className="text-sm text-muted-foreground">فیلتر و جستجو در نظرات ثبت‌شده</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'promoter', 'passive', 'detractor'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSegmentFilter(key)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs transition-colors',
                    segmentFilter === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  {key === 'ALL' ? 'همه' : NPS_SEGMENT_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceSearchField
              id="survey-search"
              value={search}
              onChange={setSearch}
              placeholder="نام مشتری، نظر یا موضوع تیکت..."
              className="min-w-[16rem] flex-1"
            />
            <ExportToolbar
              title="گزارش نظرسنجی رضایت (NPS)"
              subtitle="پاسخ‌های فیلترشده مشتریان"
              filenameBase="nps-surveys-report"
              columns={[
                { key: 'score', header: 'امتیاز', width: 10 },
                { key: 'segment', header: 'بخش', width: 12 },
                { key: 'customer', header: 'مشتری', width: 18 },
                { key: 'ticket', header: 'تیکت', width: 24 },
                { key: 'comment', header: 'نظر', width: 36 },
                { key: 'createdAt', header: 'تاریخ', width: 16 },
              ]}
              rows={filtered.map((row) => ({
                score: row.score,
                segment: NPS_SEGMENT_LABELS[classifyNpsScore(row.score)],
                customer: row.customerName,
                ticket: row.ticketSubject,
                comment: row.comment,
                createdAt: formatJalali(row.createdAt, true),
              }))}
            />
          </div>

          <DataTable columns={columns} data={filtered} showSearch={false} />
        </CardContent>
      </Card>
    </div>
  );
}
