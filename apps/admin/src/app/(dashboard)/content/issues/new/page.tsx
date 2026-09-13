import { prisma, IssueStatus } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { IssueForm } from '@/components/content/issue-form';
import { getSuggestedIssueNumber } from '@/actions/issues';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';

export default async function NewIssuePage() {
  await requirePermission(PERMISSIONS.ISSUE_CREATE);

  const [suggestedNumber, articles] = await Promise.all([
    getSuggestedIssueNumber(),
    prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, readingTime: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="شماره جدید"
        description="ایجاد شماره با آپلود PDF، کاور و مدیریت فهرست مطالب"
        backHref="/content/issues"
        backLabel="بازگشت به شماره‌ها"
      />
      <IssueForm
        mode="create"
        articles={articles}
        defaultValues={{
          number: suggestedNumber,
          status: IssueStatus.DRAFT,
          tableOfContents: [],
        }}
      />
    </div>
  );
}
