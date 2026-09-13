import Link from 'next/link';
import { prisma } from '@vargah/database';
import { Button } from '@vargah/ui/components/button';
import { PageHeader } from '@/components/ui/data-table';
import { IssuesWorkspace } from '@/components/content/issues-workspace';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
export default async function IssuesPage() {
  await requirePermission(PERMISSIONS.ISSUE_VIEW);
  const session = await requireAuth();

  const issues = await prisma.issue.findMany({
    orderBy: { number: 'desc' },
    include: { _count: { select: { articles: true } } },
  });

  const canDelete = await hasPermissionAsync(session.user.role, PERMISSIONS.ISSUE_DELETE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیریت شماره‌ها"
        description="آپلود PDF، کاور، فهرست مطالب و انتشار شماره‌های ماهنامه"
        action={
          <Link href="/content/issues/new">
            <Button className="rounded-xl">+ شماره جدید</Button>
          </Link>
        }
      />
      <IssuesWorkspace issues={issues} canDelete={canDelete} />
    </div>
  );
}
