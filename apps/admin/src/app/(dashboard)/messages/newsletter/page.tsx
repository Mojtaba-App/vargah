import { NewsletterStatus, prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { PaginationLinks, parsePageParam } from '@/components/ui/pagination-links';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { NewsletterWorkspace } from '@/components/newsletter/newsletter-workspace';

const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function NewsletterAdminPage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.MESSAGE_VIEW);
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const skip = (page - 1) * PAGE_SIZE;

  const status =
    params.status === 'active'
      ? NewsletterStatus.ACTIVE
      : params.status === 'unsubscribed'
        ? NewsletterStatus.UNSUBSCRIBED
        : params.status === 'pending'
          ? NewsletterStatus.PENDING
          : undefined;

  const where = status ? { status } : undefined;

  const [total, rows, activeCount] = await Promise.all([
    prisma.newsletterSubscription.count({ where }),
    prisma.newsletterSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        status: true,
        source: true,
        confirmedAt: true,
        unsubscribedAt: true,
        unsubscribeToken: true,
        createdAt: true,
      },
    }),
    prisma.newsletterSubscription.count({ where: { status: NewsletterStatus.ACTIVE } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="خبرنامه ایمیلی"
        description={`اعضای خبرنامه سایت — فعال: ${activeCount.toLocaleString('fa-IR')}`}
      />
      <NewsletterWorkspace
        rows={rows.map((r) => ({
          ...r,
          confirmedAt: r.confirmedAt?.toISOString() ?? null,
          unsubscribedAt: r.unsubscribedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
        activeCount={activeCount}
        statusFilter={params.status ?? 'all'}
      />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        total={total}
        basePath="/messages/newsletter"
        searchParams={params}
      />
    </div>
  );
}
