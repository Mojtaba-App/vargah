import Link from 'next/link';
import { prisma } from '@vargah/database';
import { Button } from '@vargah/ui/components/button';
import { PageHeader } from '@/components/ui/data-table';
import { PaginationLinks, parsePageParam } from '@/components/ui/pagination-links';
import { TicketsWorkspace } from '@/components/crm/tickets-workspace';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function TicketsPage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.TICKET_VIEW);
  const session = await requireAuth();
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const skip = (page - 1) * PAGE_SIZE;

  const [total, tickets] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: PAGE_SIZE,
      include: {
        assignedTo: { select: { name: true } },
        _count: { select: { replies: true } },
        replies: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { author: { select: { name: true } } },
        },
      },
    }),
  ]);

  const rows = tickets.map((ticket) => ({
    id: ticket.id,
    subject: ticket.subject,
    body: ticket.body,
    customerName: ticket.customerName,
    customerEmail: ticket.customerEmail,
    customerPhone: ticket.customerPhone,
    customerType: ticket.customerType,
    status: ticket.status,
    priority: ticket.priority,
    assigneeName: ticket.assignedTo?.name ?? null,
    subscriberId: ticket.subscriberId,
    advertiserId: ticket.advertiserId,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    resolvedAt: ticket.resolvedAt,
    _count: ticket._count,
    replies: [...ticket.replies].reverse().map((reply) => ({
      id: reply.id,
      body: reply.body,
      isInternal: reply.isInternal,
      authorName: reply.author?.name ?? null,
      createdAt: reply.createdAt,
    })),
  }));

  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.TICKET_MANAGE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="تیکت‌های مشتریان"
        description="پیگیری CRM مشترکین و آگهی‌دهندگان — مجزا از صندوق فرم‌های عمومی سایت"
        action={
          canManage ? (
            <Link href="/crm/tickets/new">
              <Button className="rounded-xl">تیکت جدید</Button>
            </Link>
          ) : undefined
        }
      />
      <TicketsWorkspace tickets={rows} canManage={canManage} />
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        total={total}
        basePath="/crm/tickets"
        searchParams={params}
      />
    </div>
  );
}
