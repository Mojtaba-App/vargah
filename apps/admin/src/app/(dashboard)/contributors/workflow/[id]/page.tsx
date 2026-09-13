import { notFound } from 'next/navigation';
import { prisma } from '@vargah/database';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { PageHeader } from '@/components/ui/data-table';
import { CommissionWorkflowActions } from '@/components/contributors/commission-workflow-actions';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { COMMISSION_STATUS_LABELS } from '@/lib/contributors/constants';
import { formatJalali } from '@/lib/utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';

export default async function CommissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);
  const session = await requireAuth();
  const { id } = await params;

  const [commission, writers, contributors] = await Promise.all([
    prisma.articleCommission.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        contributor: {
          include: {
            ratings: { orderBy: { createdAt: 'desc' }, take: 5 },
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['WRITER', 'COPY_EDITOR'] }, status: 'ACTIVE' },
      select: { id: true, name: true },
    }),
    prisma.contributor.findMany({
      include: { user: { select: { name: true } } },
    }),
  ]);

  if (!commission) notFound();

  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.CONTRIBUTOR_MANAGE);

  const avgRating = commission.contributor?.ratings.length
    ? (
        commission.contributor.ratings.reduce((s, r) => s + r.score, 0) /
        commission.contributor.ratings.length
      ).toFixed(1)
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={commission.title}
        description="جزئیات سفارش مطلب"
        backHref="/contributors/workflow"
        backLabel="بازگشت به گردش کار"
      />
      <Card className="rounded-2xl">
        <CardContent className="space-y-4 pt-6">
          <Badge>{COMMISSION_STATUS_LABELS[commission.status]}</Badge>
          {commission.description && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{commission.description}</p>
          )}
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>سردبیر: {commission.createdBy.name}</p>
            <p>نویسنده: {commission.assignee?.name ?? '—'}</p>
            <p>همکار: {commission.contributor?.user.name ?? '—'}</p>
            <p>مهلت: {commission.dueDate ? formatJalali(commission.dueDate) : '—'}</p>
            {avgRating && <p>میانگین امتیاز همکار: {avgRating} / ۵</p>}
          </div>
        </CardContent>
      </Card>
      <CommissionWorkflowActions
        commissionId={commission.id}
        status={commission.status}
        contributorId={commission.contributorId}
        assigneeId={commission.assigneeId}
        writers={writers}
        contributors={contributors.map((c) => ({ id: c.id, userName: c.user.name }))}
        canManage={canManage}
      />
    </div>
  );
}
