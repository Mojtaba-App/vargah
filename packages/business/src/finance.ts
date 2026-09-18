import { PaymentStatus, PaymentType } from '@vargah/database';

export type PaymentLike = {
  status: PaymentStatus | string;
  type: PaymentType | string;
  amount: number | string | { toString(): string };
  paidAt: Date | null;
  createdAt?: Date | null;
};

export type MonthlyRevenue = {
  subscription: number;
  advertisement: number;
  other: number;
  total: number;
};

export type FinanceSummary = {
  monthlyIncome: MonthlyRevenue;
  monthlyExpense: number;
  monthlyNet: number;
  totalPaidAllTime: number;
  totalPending: number;
  totalFailed: number;
  totalRefundedAllTime: number;
  paymentCount: number;
};

export type MonthlyFinancePoint = {
  key: string;
  year: number;
  month: number;
  income: number;
  expense: number;
  net: number;
  subscription: number;
  advertisement: number;
};

function amountOf(p: PaymentLike): number {
  return Number(p.amount);
}

function paymentDate(p: PaymentLike): Date | null {
  return p.paidAt ?? p.createdAt ?? null;
}

function isInMonth(date: Date, ref: Date): boolean {
  return date.getMonth() === ref.getMonth() && date.getFullYear() === ref.getFullYear();
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** محاسبه درآمد ماهانه اشتراک و تبلیغات */
export function calculateMonthlyRevenue(
  payments: PaymentLike[],
  referenceDate = new Date(),
): { subscription: number; advertisement: number; total: number } {
  const result = calculateMonthlyRevenueDetailed(payments, referenceDate);
  return {
    subscription: result.subscription,
    advertisement: result.advertisement,
    total: result.total,
  };
}

export function calculateMonthlyRevenueDetailed(
  payments: PaymentLike[],
  referenceDate = new Date(),
): MonthlyRevenue {
  const monthly = payments.filter(
    (p) => p.status === PaymentStatus.PAID && p.paidAt && isInMonth(p.paidAt, referenceDate),
  );

  const subscription = monthly
    .filter((p) => p.type === PaymentType.SUBSCRIPTION)
    .reduce((sum, p) => sum + amountOf(p), 0);

  const advertisement = monthly
    .filter((p) => p.type === PaymentType.ADVERTISEMENT)
    .reduce((sum, p) => sum + amountOf(p), 0);

  const other = monthly
    .filter((p) => p.type === PaymentType.OTHER)
    .reduce((sum, p) => sum + amountOf(p), 0);

  return { subscription, advertisement, other, total: subscription + advertisement + other };
}

export function calculateMonthlyExpense(
  payments: PaymentLike[],
  referenceDate = new Date(),
): number {
  return payments
    .filter((p) => {
      if (p.status !== PaymentStatus.REFUNDED) return false;
      const date = paymentDate(p);
      return date && isInMonth(date, referenceDate);
    })
    .reduce((sum, p) => sum + amountOf(p), 0);
}

export function calculateFinanceSummary(
  payments: PaymentLike[],
  referenceDate = new Date(),
): FinanceSummary {
  const monthlyIncome = calculateMonthlyRevenueDetailed(payments, referenceDate);
  const monthlyExpense = calculateMonthlyExpense(payments, referenceDate);

  return {
    monthlyIncome,
    monthlyExpense,
    monthlyNet: monthlyIncome.total - monthlyExpense,
    totalPaidAllTime: payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + amountOf(p), 0),
    totalPending: payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + amountOf(p), 0),
    totalFailed: payments
      .filter((p) => p.status === PaymentStatus.FAILED)
      .reduce((sum, p) => sum + amountOf(p), 0),
    totalRefundedAllTime: payments
      .filter((p) => p.status === PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + amountOf(p), 0),
    paymentCount: payments.length,
  };
}

/** سری ۶ ماهه درآمد و هزینه (بازگشت وجه) */
export function buildMonthlyFinanceSeries(
  payments: PaymentLike[],
  months = 6,
  referenceDate = new Date(),
): MonthlyFinancePoint[] {
  const points: MonthlyFinancePoint[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const incomeDetail = calculateMonthlyRevenueDetailed(payments, ref);
    const expense = calculateMonthlyExpense(payments, ref);

    points.push({
      key: monthKey(ref),
      year: ref.getFullYear(),
      month: ref.getMonth(),
      income: incomeDetail.total,
      expense,
      net: incomeDetail.total - expense,
      subscription: incomeDetail.subscription,
      advertisement: incomeDetail.advertisement,
    });
  }

  return points;
}

export function groupRevenueByType(
  payments: PaymentLike[],
  referenceDate = new Date(),
): { type: PaymentType; amount: number }[] {
  const monthly = payments.filter(
    (p) => p.status === PaymentStatus.PAID && p.paidAt && isInMonth(p.paidAt, referenceDate),
  );

  return [PaymentType.SUBSCRIPTION, PaymentType.ADVERTISEMENT, PaymentType.OTHER].map((type) => ({
    type,
    amount: monthly.filter((p) => p.type === type).reduce((sum, p) => sum + amountOf(p), 0),
  }));
}

export function groupByStatus(
  payments: PaymentLike[],
): { status: PaymentStatus; count: number; amount: number }[] {
  return [
    PaymentStatus.PAID,
    PaymentStatus.PENDING,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
  ].map((status) => {
    const rows = payments.filter((p) => p.status === status);
    return {
      status,
      count: rows.length,
      amount: rows.reduce((sum, p) => sum + amountOf(p), 0),
    };
  });
}
