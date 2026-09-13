import { notFound } from 'next/navigation';
import { prisma } from '@vargah/database';
import { Badge } from '@vargah/ui/components/badge';
import { PageHeader } from '@/components/ui/data-table';
import { IssueForm } from '@/components/content/issue-form';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { ISSUE_STATUS_LABELS, ISSUE_STATUS_VARIANT } from '@/lib/issues/constants';
import { PERMISSIONS } from '@/lib/permissions';
import { buildIssueFormDefaults } from '@/lib/schemas/issue-form';

type Props = { params: Promise<{ id: string }> };

export default async function EditIssuePage({ params }: Props) {
  await requirePermission(PERMISSIONS.ISSUE_EDIT);
  await requireAuth();
  const { id } = await params;

  const [issue, articles] = await Promise.all([
    prisma.issue.findUnique({ where: { id } }),
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, readingTime: true },
    }),
  ]);

  if (!issue) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`ویرایش شماره ${issue.number}`}
        description={issue.title}
        backHref="/content/issues"
        backLabel="بازگشت به شماره‌ها"
        action={
          <Badge variant={ISSUE_STATUS_VARIANT[issue.status]}>
            {ISSUE_STATUS_LABELS[issue.status]}
          </Badge>
        }
      />
      <IssueForm
        mode="edit"
        issueId={issue.id}
        articles={articles}
        defaultValues={buildIssueFormDefaults(issue)}
      />
    </div>
  );
}
