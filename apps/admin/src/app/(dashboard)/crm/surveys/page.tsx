import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { PaginationLinks, parsePageParam } from '@/components/ui/pagination-links';
import { SurveysWorkspace } from '@/components/crm/surveys-workspace';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';

const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SurveysPage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.TICKET_VIEW);
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const skip = (page - 1) * PAGE_SIZE;

  const [total, surveys] = await Promise.all([
    prisma.satisfactionSurvey.count(),
    prisma.satisfactionSurvey.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: { ticket: { select: { id: true, subject: true } } },
    }),
  ]);

  const rows = surveys.map((s) => ({
    id: s.id,
    score: s.score,
    comment: s.comment,
    customerName: s.customerName,
    createdAt: s.createdAt,
    ticketId: s.ticketId,
    ticketSubject: s.ticket?.subject ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="رضایت‌سنجی (NPS)"
        description="تحلیل Net Promoter Score، میانگین امتیاز و بازخورد مشتریان پس از پشتیبانی"
      />
      <SurveysWorkspace surveys={rows} />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        total={total}
        basePath="/crm/surveys"
        searchParams={params}
      />
    </div>
  );
}
