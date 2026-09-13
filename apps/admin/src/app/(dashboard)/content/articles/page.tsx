import Link from 'next/link';
import { prisma } from '@vargah/database';
import { Button } from '@vargah/ui/components/button';
import { PageHeader } from '@/components/ui/data-table';
import { ArticlesWorkspace } from '@/components/content/articles-workspace';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
export default async function ArticlesPage() {
  await requirePermission(PERMISSIONS.ARTICLE_VIEW);
  const session = await requireAuth();

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        author: { select: { name: true } },
        category: { select: { id: true, name: true } },
        issue: { select: { number: true, title: true } },
        _count: { select: { pageViews: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  const canDelete = await hasPermissionAsync(session.user.role, PERMISSIONS.ARTICLE_DELETE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیریت مقالات"
        description="ایجاد، ویرایش، انتشار، فیلتر و پیگیری گردش کار مطالب"
        action={
          <Link href="/content/articles/new">
            <Button className="rounded-xl">+ مقاله جدید</Button>
          </Link>
        }
      />
      <ArticlesWorkspace articles={articles} categories={categories} canDelete={canDelete} />
    </div>
  );
}
