import { prisma } from '@vargah/database';

import { TaxonomyWorkspace } from '@/components/content/taxonomy-workspace';
import { PageHeader } from '@/components/ui/data-table';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';

export default async function CategoriesPage() {
  await requirePermission(PERMISSIONS.CATEGORY_MANAGE);

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { name: true } },
        _count: { select: { articles: true, children: true } },
      },
    }),
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="دسته‌بندی‌ها و برچسب‌ها"
        description="مدیریت taxonomy محتوا — دسته‌های سلسله‌مراتبی و برچسب‌ها"
      />
      <TaxonomyWorkspace categories={categories} tags={tags} />
    </div>
  );
}
