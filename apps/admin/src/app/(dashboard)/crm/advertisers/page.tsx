import { Prisma, prisma } from '@vargah/database';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';

import { AdvertisersWorkspace } from '@/components/crm/advertisers-workspace';
import { PageHeader } from '@/components/ui/data-table';
import { PaginationLinks, parsePageParam } from '@/components/ui/pagination-links';
import { requireAuth, requirePermission } from '@/lib/auth-utils';

const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function AdvertisersPage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.ADVERTISER_VIEW);
  const session = await requireAuth();
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const skip = (page - 1) * PAGE_SIZE;
  const q = params.q?.trim();

  const where: Prisma.AdvertiserWhereInput = q
    ? {
        OR: [
          { companyName: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const [advertisers, total] = await Promise.all([
    prisma.advertiser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { campaigns: true, payments: true, tickets: true } },
        campaigns: {
          orderBy: { startDate: 'desc' },
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { id: true, amount: true, status: true, paidAt: true, createdAt: true },
            },
          },
        },
      },
    }),
    prisma.advertiser.count({ where }),
  ]);

  const rows = advertisers.map((advertiser) => ({
    ...advertiser,
    campaigns: advertiser.campaigns.map((campaign) => ({
      ...campaign,
      tariff: Number(campaign.tariff),
      companyName: advertiser.companyName,
      payments: campaign.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    })),
  }));

  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.ADVERTISER_MANAGE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader title="آگهی‌دهندگان" description="قرارداد، کمپین و تعرفه" />
      <AdvertisersWorkspace advertisers={rows} canManage={canManage} />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        total={total}
        basePath="/crm/advertisers"
        searchParams={params}
      />
    </div>
  );
}
