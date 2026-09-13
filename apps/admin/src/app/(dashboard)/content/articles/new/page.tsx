import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { ArticleForm } from '@/components/content/article-form';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';

async function getMediaAssets() {
  return prisma.mediaAsset.findMany({
    where: { mimeType: { startsWith: 'image/' } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      url: true,
      alt: true,
      mimeType: true,
      originalName: true,
    },
  });
}

export default async function NewArticlePage() {
  await requirePermission(PERMISSIONS.ARTICLE_CREATE);
  const [categories, mediaAssets] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    getMediaAssets(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="مقاله جدید"
        description="نوشتن مطلب با ویرایشگر پیشرفته، انتخاب تصویر از کتابخانه و پیش‌نمایش سئو"
        backHref="/content/articles"
        backLabel="بازگشت به مقالات"
      />
      <ArticleForm categories={categories} mediaAssets={mediaAssets} />
    </div>
  );
}
