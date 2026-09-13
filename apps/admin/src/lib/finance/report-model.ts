import type { FinanceSummary, MonthlyFinancePoint } from '@vargah/business/finance';

import { formatNumber, formatPrice } from '@/lib/utils';

export type FinanceReportTrendRow = MonthlyFinancePoint & {
  label: string;
  labelShort: string;
};

export type FinanceReportTypeRow = {
  type: string;
  label: string;
  amount: number;
  share: number;
};

export type FinanceReportStatusRow = {
  status: string;
  label: string;
  count: number;
  amount: number;
};

export type FinanceReportTransactionRow = {
  type: string;
  amount: number;
  status: string;
  gateway: string;
  customer: string;
  paidAt: string;
  id: string;
};

export type FinanceReportPayload = {
  title: string;
  subtitle: string;
  generatedAt: Date;
  summary: FinanceSummary;
  trend: FinanceReportTrendRow[];
  typeBreakdown: FinanceReportTypeRow[];
  statusBreakdown: FinanceReportStatusRow[];
  transactions: FinanceReportTransactionRow[];
  narrative: {
    intro: string;
    monthlyInsight: string;
    mixInsight: string;
    cashflowInsight: string;
    closing: string;
  };
};

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function buildFinanceReportNarrative(input: {
  summary: FinanceSummary;
  typeBreakdown: FinanceReportTypeRow[];
  trend: FinanceReportTrendRow[];
}): FinanceReportPayload['narrative'] {
  const { summary, typeBreakdown, trend } = input;
  const sub = summary.monthlyIncome.subscription;
  const ad = summary.monthlyIncome.advertisement;
  const totalMonth = summary.monthlyIncome.total;
  const net = summary.monthlyNet;
  const subShare = pct(sub, totalMonth);
  const adShare = pct(ad, totalMonth);

  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  let trendText = 'روند ماهانه در حال پایش است.';
  if (last && prev) {
    const delta = last.income - prev.income;
    if (delta > 0) {
      trendText = `درآمد ${last.label} نسبت به ${prev.label} حدود ${formatPrice(delta)} تومان رشد داشته است.`;
    } else if (delta < 0) {
      trendText = `درآمد ${last.label} نسبت به ${prev.label} حدود ${formatPrice(Math.abs(delta))} تومان کاهش داشته است.`;
    } else {
      trendText = `درآمد ${last.label} نسبت به ${prev.label} تقریباً ثابت مانده است.`;
    }
  }

  const topType = [...typeBreakdown].sort((a, b) => b.amount - a.amount)[0];

  return {
    intro:
      'این گزارش نمای کلی عملکرد مالی مجله وارگه را بر اساس تراکنش‌های ثبت‌شده در سامانه نشان می‌دهد. ارقام درآمد صرفاً از پرداخت‌های موفق محاسبه شده و هزینه‌های ماهانه عمدتاً شامل بازگشت وجه است.',
    monthlyInsight: `در ماه جاری، درآمد کل ${formatPrice(totalMonth)} تومان بوده که از این میزان ${formatPrice(sub)} تومان (${formatNumber(subShare)}٪) از اشتراک و ${formatPrice(ad)} تومان (${formatNumber(adShare)}٪) از تبلیغات تأمین شده است. خالص عملکرد ماه پس از کسر بازگشت وجه (${formatPrice(summary.monthlyExpense)} تومان) برابر ${formatPrice(net)} تومان است.`,
    mixInsight: topType
      ? `بیشترین سهم درآمد ماه متعلق به «${topType.label}» با ${formatPrice(topType.amount)} تومان (${formatNumber(topType.share)}٪) است. تنوع درآمدی بین اشتراک و تبلیغات به پایداری جریان نقدی کمک می‌کند.`
      : 'در ماه جاری ترکیب درآمدی قابل‌توجهی ثبت نشده است.',
    cashflowInsight: `${trendText} مجموع درآمد پرداخت‌شده از ابتدا ${formatPrice(summary.totalPaidAllTime)} تومان و حجم مبالغ در انتظار/ناموفق به‌ترتیب ${formatPrice(summary.totalPending)} و ${formatPrice(summary.totalFailed)} تومان است.`,
    closing:
      'پیشنهاد می‌شود روند ماهانه، سهم تبلیغات و نرخ بازگشت وجه به‌صورت دوره‌ای پایش شود تا تصمیم‌های قیمت‌گذاری و کمپین تبلیغاتی بر پایه داده واقعی اتخاذ گردد.',
  };
}

export function withTypeShares(
  rows: Array<{ type: string; label: string; amount: number }>,
): FinanceReportTypeRow[] {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return rows.map((row) => ({
    ...row,
    share: pct(row.amount, total),
  }));
}
