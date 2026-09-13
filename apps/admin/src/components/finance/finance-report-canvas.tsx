'use client';

import type { FinanceReportPayload } from '@/lib/finance/report-model';
import { formatJalali, formatNumber, formatPrice } from '@/lib/utils';

type FinanceReportCanvasProps = {
  payload: FinanceReportPayload;
};

export function FinanceReportCanvas({ payload }: FinanceReportCanvasProps) {
  const maxIncome = Math.max(1, ...payload.trend.map((point) => point.income));

  return (
    <div
      className="w-[920px] space-y-5 bg-[#f8faf9] p-6 text-[#0f172a]"
      dir="rtl"
      style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}
    >
      <header className="overflow-hidden rounded-2xl bg-[#1a6b66] px-6 py-5 text-white">
        <p className="text-xs opacity-80">گزارش مالی مجله وارگه</p>
        <h1 className="mt-1 text-2xl font-bold">{payload.title}</h1>
        <p className="mt-1 text-sm opacity-90">{payload.subtitle}</p>
        <p className="mt-2 text-xs opacity-75">
          تاریخ خروجی: {formatJalali(payload.generatedAt, true)}
        </p>
      </header>

      <section className="rounded-2xl border border-[#d8e4e1] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1a6b66]">مقدمه تحلیلی</h2>
        <p className="mt-2 text-xs leading-7 text-slate-600">{payload.narrative.intro}</p>
      </section>

      <section className="grid grid-cols-4 gap-3">
        <Kpi
          label="درآمد ماه"
          value={`${formatPrice(payload.summary.monthlyIncome.total)} ت`}
          tone="income"
        />
        <Kpi
          label="هزینه ماه"
          value={`${formatPrice(payload.summary.monthlyExpense)} ت`}
          tone="expense"
        />
        <Kpi
          label="سود / خالص"
          value={`${formatPrice(payload.summary.monthlyNet)} ت`}
          tone={payload.summary.monthlyNet >= 0 ? 'net' : 'expense'}
        />
        <Kpi
          label="کل درآمد"
          value={`${formatPrice(payload.summary.totalPaidAllTime)} ت`}
          tone="brand"
        />
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Kpi
          label="اشتراک (ماه)"
          value={`${formatPrice(payload.summary.monthlyIncome.subscription)} ت`}
          tone="sub"
        />
        <Kpi
          label="تبلیغات (ماه)"
          value={`${formatPrice(payload.summary.monthlyIncome.advertisement)} ت`}
          tone="ad"
        />
        <Kpi
          label="تراکنش‌ها"
          value={formatNumber(payload.summary.paymentCount)}
          tone="muted"
        />
      </section>

      <section className="rounded-2xl border border-[#d8e4e1] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1a6b66]">شماتیک ترکیب درآمد ماه</h2>
        <p className="mt-1 text-xs text-slate-500">{payload.narrative.mixInsight}</p>
        <div className="mt-4 space-y-3">
          {payload.typeBreakdown.map((row) => (
            <div key={row.type}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{row.label}</span>
                <span className="tabular-nums text-slate-600">
                  {formatPrice(row.amount)} ت · {formatNumber(row.share)}٪
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(row.share, row.amount > 0 ? 2 : 0)}%`,
                    background:
                      row.type === 'SUBSCRIPTION'
                        ? '#6366f1'
                        : row.type === 'ADVERTISEMENT'
                          ? '#06b6d4'
                          : '#94a3b8',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#d8e4e1] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1a6b66]">روند ۶ ماهه</h2>
        <p className="mt-1 text-xs text-slate-500">{payload.narrative.monthlyInsight}</p>
        <div className="mt-4 space-y-2">
          {payload.trend.map((point) => (
            <div key={point.key} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-xs">
              <span className="font-medium">{point.labelShort}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${(point.income / maxIncome) * 100}%` }}
                />
              </div>
              <span className="min-w-[7rem] text-end tabular-nums text-slate-600">
                {formatPrice(point.income)} ت
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-[#1a6b66] text-white">
              <tr>
                <th className="px-3 py-2 text-start font-semibold">ماه</th>
                <th className="px-3 py-2 text-start font-semibold">درآمد</th>
                <th className="px-3 py-2 text-start font-semibold">هزینه</th>
                <th className="px-3 py-2 text-start font-semibold">خالص</th>
              </tr>
            </thead>
            <tbody>
              {payload.trend.map((point, index) => (
                <tr key={point.key} className={index % 2 ? 'bg-[#f2efe6]' : 'bg-white'}>
                  <td className="px-3 py-1.5">{point.label}</td>
                  <td className="px-3 py-1.5 tabular-nums">{formatPrice(point.income)}</td>
                  <td className="px-3 py-1.5 tabular-nums">{formatPrice(point.expense)}</td>
                  <td className="px-3 py-1.5 tabular-nums">{formatPrice(point.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[#d8e4e1] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1a6b66]">وضعیت پرداخت‌ها</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {payload.statusBreakdown.map((row) => (
            <div key={row.status} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">{row.label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatNumber(row.count)}</p>
              <p className="text-[11px] tabular-nums text-slate-600">{formatPrice(row.amount)} ت</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-7 text-slate-600">{payload.narrative.cashflowInsight}</p>
      </section>

      <footer className="rounded-2xl border border-[#d8e4e1] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1a6b66]">جمع‌بندی</h2>
        <p className="mt-2 text-xs leading-7 text-slate-600">{payload.narrative.closing}</p>
      </footer>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'income' | 'expense' | 'net' | 'brand' | 'sub' | 'ad' | 'muted';
}) {
  const toneClass = {
    income: 'text-emerald-600',
    expense: 'text-rose-600',
    net: 'text-indigo-600',
    brand: 'text-[#1a6b66]',
    sub: 'text-indigo-500',
    ad: 'text-cyan-600',
    muted: 'text-slate-700',
  }[tone];

  return (
    <div className="rounded-2xl border border-[#d8e4e1] bg-white p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-bold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
