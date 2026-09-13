import { Prisma, SubscriptionStatus, prisma } from '@vargah/database';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';

import { SubscribersWorkspace } from '@/components/crm/subscribers-workspace';
import { PageHeader } from '@/components/ui/data-table';
import { PaginationLinks, parsePageParam } from '@/components/ui/pagination-links';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { getSubscriptionPlansConfig } from '@/lib/subscription-plans-config';

const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    province?: string;
    city?: string;
  }>;
};

function buildSubscriberWhere(params: {
  q?: string;
  status?: string;
  province?: string;
  city?: string;
}): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};
  const and: Prisma.SubscriberWhereInput[] = [];

  if (params.status === 'EXPIRING_SOON') {
    const soon = new Date();
    soon.setDate(soon.getDate() + 14);
    and.push({
      status: SubscriptionStatus.ACTIVE,
      expiresAt: { lte: soon, gte: new Date() },
    });
  } else if (
    params.status &&
    params.status !== 'ALL' &&
    Object.values(SubscriptionStatus).includes(params.status as SubscriptionStatus)
  ) {
    where.status = params.status as SubscriptionStatus;
  }

  if (params.province?.trim()) {
    and.push({ province: { equals: params.province.trim(), mode: 'insensitive' } });
  }
  if (params.city?.trim()) {
    and.push({ city: { equals: params.city.trim(), mode: 'insensitive' } });
  }

  const q = params.q?.trim();
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { planType: { contains: q, mode: 'insensitive' } },
        { province: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (and.length) where.AND = and;
  return where;
}

export default async function SubscribersPage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.SUBSCRIBER_VIEW);
  const session = await requireAuth();
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const skip = (page - 1) * PAGE_SIZE;
  const where = buildSubscriberWhere(params);

  const soon = new Date();
  soon.setDate(soon.getDate() + 14);

  const [subscribers, subscriptionPlans, total, statusGroups, expiringSoon] = await Promise.all([
    prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { payments: true, tickets: true } },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            amount: true,
            status: true,
            description: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    }),
    getSubscriptionPlansConfig(),
    prisma.subscriber.count({ where }),
    prisma.subscriber.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.subscriber.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { lte: soon, gte: new Date() },
      },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all]),
  ) as Partial<Record<SubscriptionStatus, number>>;

  const stats = {
    total: statusGroups.reduce((sum, g) => sum + g._count._all, 0),
    active: countByStatus[SubscriptionStatus.ACTIVE] ?? 0,
    expired: countByStatus[SubscriptionStatus.EXPIRED] ?? 0,
    pending: countByStatus[SubscriptionStatus.PENDING_PAYMENT] ?? 0,
    cancelled: countByStatus[SubscriptionStatus.CANCELLED] ?? 0,
    expiringSoon,
  };

  const rows = subscribers.map((subscriber) => ({
    ...subscriber,
    payments: subscriber.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })),
  }));

  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.SUBSCRIBER_MANAGE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader title="مشترکین" description="CRM — فعال، منقضی، در انتظار پرداخت" />
      <SubscribersWorkspace
        subscribers={rows}
        subscriptionPlans={subscriptionPlans}
        canManage={canManage}
        stats={stats}
        serverFiltered
        initialFilters={{
          q: params.q ?? '',
          status: params.status ?? 'ALL',
          province: params.province ?? '',
          city: params.city ?? '',
        }}
      />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        total={total}
        basePath="/crm/subscribers"
        searchParams={params}
      />
    </div>
  );
}
