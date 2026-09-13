'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { DataTable } from '@/components/ui/data-table';
import { WorkspaceSearchField } from '@/components/ui/workspace-search-field';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { FinanceExportMenu } from '@/components/finance/finance-export-menu';
import { updatePaymentStatus } from '@/actions/finance';
import {
  FinanceStatusChart,
  FinanceTrendChart,
  FinanceTypeChart,
  buildStatusChartData,
  buildTypeChartData,
} from '@/components/finance/finance-charts';
import type { FinanceSummary, MonthlyFinancePoint } from '@vargah/business/finance';
import { labelFinanceMonth, labelFinanceMonthShort } from '@/lib/finance/labels';
import {
  buildFinanceReportNarrative,
  withTypeShares,
  type FinanceReportPayload,
} from '@/lib/finance/report-model';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANT,
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPE_VARIANT,
  PaymentStatus,
  PaymentType,
  type PaymentStatusFilter,
  type PaymentTypeFilter,
} from '@/lib/finance/constants';
import { cn, formatJalali, formatNumber, formatPrice } from '@/lib/utils';

export type PaymentRow = {
  id: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  gateway: string | null;
  transactionId: string | null;
  description: string | null;
  customerName: string;
  subscriberId: string | null;
  advertiserId: string | null;
  campaignId: string | null;
  paidAt: Date | null;
  createdAt: Date;
};

type FinanceWorkspaceProps = {
  payments: PaymentRow[];
  summary: FinanceSummary;
  trend: MonthlyFinancePoint[];
  typeBreakdown: { type: PaymentType; amount: number }[];
  statusBreakdown: { status: PaymentStatus; count: number; amount: number }[];
  canExport: boolean;
  canManage?: boolean;
};

function StatCard({
  label,
  value,
  hint,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'income' | 'expense' | 'net' | 'warning' | 'default';
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClass = {
    income: 'text-emerald-600 dark:text-emerald-400',
    expense: 'text-rose-600 dark:text-rose-400',
    net: 'text-indigo-600 dark:text-indigo-400',
    warning: 'text-amber-600 dark:text-amber-400',
    default: '',
  }[tone ?? 'default'];

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
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', toneClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Comp>
  );
}

export function FinanceWorkspace({
  payments: initialPayments,
  summary,
  trend,
  typeBreakdown,
  statusBreakdown,
  canExport,
  canManage = false,
}: FinanceWorkspaceProps) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [typeFilter, setTypeFilter] = useState<PaymentTypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPayments(initialPayments);
    if (selected) {
      setSelected(initialPayments.find((p) => p.id === selected.id) ?? null);
    }
  }, [initialPayments, selected?.id]);

  const trendChartData = useMemo(
    () =>
      trend.map((point) => ({
        label: labelFinanceMonthShort(point),
        income: point.income,
        expense: point.expense,
        net: point.net,
      })),
    [trend],
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return payments.filter((p) => {
      if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!q) return true;
      return [
        p.customerName,
        p.gateway ?? '',
        p.transactionId ?? '',
        p.description ?? '',
        PAYMENT_TYPE_LABELS[p.type],
        PAYMENT_STATUS_LABELS[p.status],
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [payments, typeFilter, statusFilter, debouncedSearch]);

  const refresh = () => {
    setMessage('به‌روزرسانی شد.');
    router.refresh();
  };

  const financeExportColumns = [
    { key: 'type', header: 'نوع', width: 14 },
    { key: 'amount', header: 'مبلغ', width: 14 },
    { key: 'status', header: 'وضعیت', width: 12 },
    { key: 'gateway', header: 'درگاه', width: 12 },
    { key: 'customer', header: 'مشتری', width: 20 },
    { key: 'paidAt', header: 'تاریخ پرداخت', width: 18 },
    { key: 'id', header: 'شناسه', width: 22 },
  ];

  const financeExportRows = filtered.map((p) => ({
    type: PAYMENT_TYPE_LABELS[p.type],
    amount: p.amount,
    status: PAYMENT_STATUS_LABELS[p.status],
    gateway: p.gateway ?? '',
    customer: p.customerName,
    paidAt: p.paidAt ? formatJalali(p.paidAt, true) : '',
    id: p.id,
  }));

  const reportPayload = useMemo<FinanceReportPayload>(() => {
    const trendRows = trend.map((point) => ({
      ...point,
      label: labelFinanceMonth(point),
      labelShort: labelFinanceMonthShort(point),
    }));
    const types = withTypeShares(
      buildTypeChartData(typeBreakdown).map((row) => ({
        type: row.type,
        label: row.label,
        amount: row.amount,
      })),
    );
    const statuses = buildStatusChartData(statusBreakdown).map((row) => ({
      status: row.status,
      label: row.label,
      count: row.count,
      amount: row.amount,
    }));
    const narrative = buildFinanceReportNarrative({
      summary,
      typeBreakdown: types,
      trend: trendRows,
    });

    return {
      title: 'گزارش مالی جامع وارگه',
      subtitle: 'درآمد اشتراک و تبلیغات — تحلیل روند، ترکیب درآمد، سود خالص و وضعیت تراکنش‌ها',
      generatedAt: new Date(),
      summary,
      trend: trendRows,
      typeBreakdown: types,
      statusBreakdown: statuses,
      transactions: filtered.map((p) => ({
        type: PAYMENT_TYPE_LABELS[p.type],
        amount: p.amount,
        status: PAYMENT_STATUS_LABELS[p.status],
        gateway: p.gateway ?? '',
        customer: p.customerName,
        paidAt: p.paidAt ? formatJalali(p.paidAt, true) : '',
        id: p.id,
      })),
      narrative,
    };
  }, [summary, trend, typeBreakdown, statusBreakdown, filtered]);

  const columns = useMemo<ColumnDef<PaymentRow>[]>(
    () => [
      {
        id: 'manage',
        header: 'وضعیت',
        cell: ({ row }) =>
          canManage ? (
            <Select
              value={row.original.status}
              className="h-9 min-w-[8rem] rounded-lg text-xs"
              disabled={isPending}
              onChange={(e) => {
                const next = e.target.value as PaymentStatus;
                if (next === row.original.status) return;
                startTransition(async () => {
                  try {
                    await updatePaymentStatus(row.original.id, next);
                    refresh();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'تغییر وضعیت ناموفق بود');
                  }
                });
              }}
            >
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          ) : (
            <Badge variant={PAYMENT_STATUS_VARIANT[row.original.status]}>
              {PAYMENT_STATUS_LABELS[row.original.status]}
            </Badge>
          ),
      },
      {
        accessorKey: 'type',
        header: 'نوع',
        cell: ({ row }) => (
          <Badge variant={PAYMENT_TYPE_VARIANT[row.original.type]}>
            {PAYMENT_TYPE_LABELS[row.original.type]}
          </Badge>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'مبلغ',
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">{formatPrice(row.original.amount)} ت</span>
        ),
      },
      {
        id: 'customer',
        header: 'مشتری',
        cell: ({ row }) => (
          <button type="button" className="text-start" onClick={() => setSelected(row.original)}>
            <p className="font-medium text-primary hover:underline">{row.original.customerName}</p>
            {row.original.description && (
              <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.description}</p>
            )}
          </button>
        ),
      },
      {
        accessorKey: 'gateway',
        header: 'درگاه',
        cell: ({ row }) => <span dir="ltr">{row.original.gateway ?? '—'}</span>,
      },
      {
        accessorKey: 'paidAt',
        header: 'تاریخ',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">
            {row.original.paidAt ? formatJalali(row.original.paidAt, true) : '—'}
          </span>
        ),
      },
    ],
    [canManage, isPending],
  );

  return (
    <div className="space-y-6">
      {(message || error) && (
        <StatusBanner type={error ? 'error' : 'success'} message={error ?? message!} />
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">گزارش‌گیری مالی</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            خروجی جامع با درآمد، سود خالص، شماتیک ترکیب درآمد، روند ماهانه و توضیحات فارسی
          </p>
        </div>
        {canExport ? (
          <FinanceExportMenu
            payload={reportPayload}
            onDone={setMessage}
            onError={setError}
          />
        ) : (
          <p className="text-xs text-muted-foreground">برای خروجی به دسترسی «خروجی مالی» نیاز است.</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="درآمد ماه جاری"
          value={`${formatPrice(summary.monthlyIncome.total)} ت`}
          hint={`اشتراک ${formatPrice(summary.monthlyIncome.subscription)} · تبلیغ ${formatPrice(summary.monthlyIncome.advertisement)}`}
          tone="income"
        />
        <StatCard
          label="هزینه ماه (بازگشت)"
          value={`${formatPrice(summary.monthlyExpense)} ت`}
          hint="بازپرداخت و استرداد"
          tone="expense"
        />
        <StatCard
          label="خالص ماه"
          value={`${formatPrice(summary.monthlyNet)} ت`}
          tone={summary.monthlyNet >= 0 ? 'net' : 'expense'}
        />
        <StatCard
          label="در انتظار / ناموفق"
          value={`${formatPrice(summary.totalPending)} ت`}
          hint={`${formatNumber(payments.filter((p) => p.status === PaymentStatus.FAILED).length)} پرداخت ناموفق`}
          tone="warning"
          active={statusFilter === PaymentStatus.PENDING}
          onClick={() => setStatusFilter(PaymentStatus.PENDING)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <FinanceTrendChart data={trendChartData} />
        </div>
        <FinanceTypeChart data={buildTypeChartData(typeBreakdown)} />
      </div>

      <FinanceStatusChart data={buildStatusChartData(statusBreakdown)} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="کل درآمد پرداخت‌شده"
          value={`${formatPrice(summary.totalPaidAllTime)} ت`}
          hint={`${formatNumber(summary.paymentCount)} تراکنش`}
        />
        <StatCard
          label="اشتراک (ماه)"
          value={`${formatPrice(summary.monthlyIncome.subscription)} ت`}
          active={typeFilter === PaymentType.SUBSCRIPTION}
          onClick={() => setTypeFilter(PaymentType.SUBSCRIPTION)}
        />
        <StatCard
          label="تبلیغات (ماه)"
          value={`${formatPrice(summary.monthlyIncome.advertisement)} ت`}
          active={typeFilter === PaymentType.ADVERTISEMENT}
          onClick={() => setTypeFilter(PaymentType.ADVERTISEMENT)}
        />
      </div>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <WorkspaceSearchField
              id="payment-search"
              value={search}
              onChange={setSearch}
              placeholder="مشتری، درگاه، شناسه، توضیح..."
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs',
                  typeFilter === 'ALL' && statusFilter === 'ALL'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                همه
              </button>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value as PaymentStatus)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs',
                    statusFilter === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
              {canExport && (
                <ExportToolbar
                  title="گزارش جدول پرداخت‌ها"
                  subtitle="فهرست تراکنش‌های فیلترشده"
                  filenameBase="finance-payments"
                  columns={financeExportColumns}
                  rows={financeExportRows}
                  onDone={setMessage}
                  onError={setError}
                />
              )}
            </div>
          </div>

          <div className="hidden md:block">
            <DataTable columns={columns} data={filtered} showSearch={false} />
          </div>

          <ul className="space-y-3 md:hidden" aria-label="فهرست پرداخت‌ها">
            {filtered.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="w-full rounded-2xl border border-border bg-card p-4 text-start transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold tabular-nums">{formatPrice(row.amount)} تومان</p>
                      <p className="mt-1 text-sm text-muted-foreground">{row.customerName}</p>
                    </div>
                    <Badge variant={PAYMENT_STATUS_VARIANT[row.status]}>
                      {PAYMENT_STATUS_LABELS[row.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant={PAYMENT_TYPE_VARIANT[row.type]}>{PAYMENT_TYPE_LABELS[row.type]}</Badge>
                    <span>{formatJalali(row.createdAt, true)}</span>
                  </div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                تراکنشی یافت نشد.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {selected && (
        <Card className="rounded-2xl border-primary/20">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={PAYMENT_TYPE_VARIANT[selected.type]}>
                  {PAYMENT_TYPE_LABELS[selected.type]}
                </Badge>
                <Badge variant={PAYMENT_STATUS_VARIANT[selected.status]}>
                  {PAYMENT_STATUS_LABELS[selected.status]}
                </Badge>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setSelected(null)}>
                بستن
              </Button>
            </div>

            <p className="text-2xl font-bold tabular-nums">{formatPrice(selected.amount)} تومان</p>

            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-muted-foreground">مشتری</p>
                <p className="font-medium">{selected.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">درگاه</p>
                <p className="font-medium" dir="ltr">
                  {selected.gateway ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">شناسه تراکنش</p>
                <p className="font-medium" dir="ltr">
                  {selected.transactionId ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">تاریخ پرداخت</p>
                <p className="font-medium">
                  {selected.paidAt ? formatJalali(selected.paidAt, true) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">تاریخ ثبت</p>
                <p className="font-medium">{formatJalali(selected.createdAt, true)}</p>
              </div>
            </div>

            {selected.description && (
              <p className="rounded-xl border border-border bg-muted/20 p-3 text-sm">{selected.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {selected.subscriberId && (
                <Link href="/crm/subscribers">
                  <Button type="button" size="sm" variant="outline" className="rounded-xl">
                    مشترک مرتبط
                  </Button>
                </Link>
              )}
              {selected.advertiserId && (
                <Link href="/crm/advertisers">
                  <Button type="button" size="sm" variant="outline" className="rounded-xl">
                    آگهی‌دهنده مرتبط
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
