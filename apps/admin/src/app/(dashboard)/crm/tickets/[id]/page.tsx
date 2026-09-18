import { notFound } from 'next/navigation';
import { prisma } from '@vargah/database';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { PageHeader } from '@/components/ui/data-table';
import { PaginationLinks, parsePageParam } from '@/components/ui/pagination-links';
import { TicketDetailActions } from '@/components/crm/ticket-detail-actions';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
import {
  getTicketShortId,
  TICKET_CUSTOMER_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_VARIANT,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_VARIANT,
} from '@/lib/crm/tickets/constants';
import { formatJalali } from '@/lib/utils';

const REPLY_PAGE_SIZE = 40;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function TicketDetailPage({ params, searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.TICKET_VIEW);
  const session = await requireAuth();
  const { id } = await params;
  const query = await searchParams;
  const replyPage = parsePageParam(query.page);
  const skip = (replyPage - 1) * REPLY_PAGE_SIZE;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      surveys: { select: { id: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { replies: true } },
    },
  });

  if (!ticket) notFound();

  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: 'asc' },
    skip,
    take: REPLY_PAGE_SIZE,
    include: { author: { select: { name: true } } },
  });

  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.TICKET_MANAGE);
  const replyTotal = ticket._count.replies;
  const replyTotalPages = Math.max(1, Math.ceil(replyTotal / REPLY_PAGE_SIZE));

  const replyRows = replies.map((r) => ({
    id: r.id,
    body: r.body,
    isInternal: r.isInternal,
    authorName: r.author?.name ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={ticket.subject}
        description={`تیکت #${getTicketShortId(ticket.id)}`}
        backHref="/crm/tickets"
        backLabel="بازگشت به تیکت‌ها"
      />
      <Card className="rounded-2xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant={TICKET_STATUS_VARIANT[ticket.status]}>
              {TICKET_STATUS_LABELS[ticket.status]}
            </Badge>
            <Badge variant={TICKET_PRIORITY_VARIANT[ticket.priority]}>
              {TICKET_PRIORITY_LABELS[ticket.priority]}
            </Badge>
            <Badge variant="outline">{TICKET_CUSTOMER_TYPE_LABELS[ticket.customerType]}</Badge>
          </div>
          <p className="text-sm">
            <strong>{ticket.customerName}</strong>
            {ticket.customerEmail && (
              <>
                {' '}
                — <span dir="ltr">{ticket.customerEmail}</span>
              </>
            )}
            {ticket.customerPhone && (
              <>
                {' '}
                — <span dir="ltr">{ticket.customerPhone}</span>
              </>
            )}
          </p>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{ticket.body}</p>
          <p className="text-muted-foreground text-xs">
            ایجاد: {formatJalali(ticket.createdAt, true)}
            {ticket.assignedTo?.name && <> — مسئول: {ticket.assignedTo.name}</>}
          </p>
        </CardContent>
      </Card>
      <TicketDetailActions
        ticketId={ticket.id}
        status={ticket.status}
        replies={replyRows}
        hasSurvey={ticket.surveys.length > 0}
        canManage={canManage}
      />
      {replyTotalPages > 1 ? (
        <PaginationLinks
          page={replyPage}
          totalPages={replyTotalPages}
          total={replyTotal}
          basePath={`/crm/tickets/${id}`}
          searchParams={query}
        />
      ) : null}
    </div>
  );
}
