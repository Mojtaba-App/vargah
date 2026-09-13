import {
  PaymentStatus,
  PaymentType,
  prisma,
} from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { PaginationLinks, parsePageParam } from '@/components/ui/pagination-links';
import { FinanceWorkspace } from '@/components/finance/finance-workspace';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
import type {
  FinanceSummary,
  MonthlyFinancePoint,
} from '@vargah/business/finance';

const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

function monthBounds(ref: Date, offsetMonths: number) {
  const start = new Date(ref.getFullYear(), ref.getMonth() + offsetMonths, 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + offsetMonths + 1, 1);
  return { start, end };
}

async function sumPaid(type: PaymentType, start: Date, end: Date) {
  const row = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.PAID,
      type,
      paidAt: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });
  return Number(row._sum.amount ?? 0);
}

async function sumRefunded(start: Date, end: Date) {
  const row = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.REFUNDED,
      OR: [
        { paidAt: { gte: start, lt: end } },
        { AND: [{ paidAt: null }, { createdAt: { gte: start, lt: end } }] },
      ],
    },
    _sum: { amount: true },
  });
  return Number(row._sum.amount ?? 0);
}

async function buildFinanceDashboard(now: Date) {
  const thisMonth = monthBounds(now, 0);

  const [
    monthlySub,
    monthlyAd,
    monthlyOther,
    monthlyRefund,
    totalPaid,
    totalPending,
    totalFailed,
    totalRefunded,
    paymentCount,
    statusGroups,
    typeGroups,
  ] = await Promise.all([
    sumPaid(PaymentType.SUBSCRIPTION, thisMonth.start, thisMonth.end),
    sumPaid(PaymentType.ADVERTISEMENT, thisMonth.start, thisMonth.end),
    sumPaid(PaymentType.OTHER, thisMonth.start, thisMonth.end),
    sumRefunded(thisMonth.start, thisMonth.end),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PENDING },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.FAILED },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.REFUNDED },
      _sum: { amount: true },
    }),
    prisma.payment.count(),
    prisma.payment.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ['type'],
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: thisMonth.start, lt: thisMonth.end },
      },
      _sum: { amount: true },
    }),
  ]);

  const summary: FinanceSummary = {
    monthlyIncome: {
      subscription: monthlySub,
      advertisement: monthlyAd,
      other: monthlyOther,
      total: monthlySub + monthlyAd + monthlyOther,
    },
    monthlyExpense: monthlyRefund,
    monthlyNet: monthlySub + monthlyAd + monthlyOther - monthlyRefund,
    totalPaidAllTime: Number(totalPaid._sum.amount ?? 0),
    totalPending: Number(totalPending._sum.amount ?? 0),
    totalFailed: Number(totalFailed._sum.amount ?? 0),
    totalRefundedAllTime: Number(totalRefunded._sum.amount ?? 0),
    paymentCount,
  };

  const trend: MonthlyFinancePoint[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const { start, end } = monthBounds(now, -i);
    const [subscription, advertisement, other, expense] = await Promise.all([
      sumPaid(PaymentType.SUBSCRIPTION, start, end),
      sumPaid(PaymentType.ADVERTISEMENT, start, end),
      sumPaid(PaymentType.OTHER, start, end),
      sumRefunded(start, end),
    ]);
    const income = subscription + advertisement + other;
    trend.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      year: start.getFullYear(),
      month: start.getMonth(),
      income,
      expense,
      net: income - expense,
      subscription,
      advertisement,
    });
  }

  const typeBreakdown = typeGroups.map((g) => ({
    type: g.type,
    amount: Number(g._sum.amount ?? 0),
  }));

  const statusBreakdown = statusGroups.map((g) => ({
    status: g.status,
    count: g._count._all,
    amount: Number(g._sum.amount ?? 0),
  }));

  return { summary, trend, typeBreakdown, statusBreakdown };
}

export default async function FinancePage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.FINANCE_VIEW);
  const session = await requireAuth();
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const skip = (page - 1) * PAGE_SIZE;
  const now = new Date();

  const [dashboard, total, payments] = await Promise.all([
    buildFinanceDashboard(now),
    prisma.payment.count(),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        subscriber: { select: { id: true, name: true } },
        advertiser: { select: { id: true, companyName: true } },
      },
    }),
  ]);

  const rows = payments.map((p) => ({
    id: p.id,
    type: p.type,
    amount: Number(p.amount),
    status: p.status,
    gateway: p.gateway,
    transactionId: p.transactionId,
    description: p.description,
    customerName: p.subscriber?.name ?? p.advertiser?.companyName ?? '—',
    subscriberId: p.subscriberId,
    advertiserId: p.advertiserId,
    campaignId: p.campaignId,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
  }));

  const canExport = await hasPermissionAsync(session.user.role, PERMISSIONS.FINANCE_EXPORT);
  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.FINANCE_MANAGE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="مالی و گزارش‌گیری"
        description="درآمد اشتراک و تبلیغات — نمودار، روند و گزارش تراکنش‌ها"
      />
      <FinanceWorkspace
        payments={rows}
        summary={dashboard.summary}
        trend={dashboard.trend}
        typeBreakdown={dashboard.typeBreakdown}
        statusBreakdown={dashboard.statusBreakdown}
        canExport={canExport}
        canManage={canManage}
      />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        total={total}
        basePath="/finance"
        searchParams={params}
      />
    </div>
  );
}
