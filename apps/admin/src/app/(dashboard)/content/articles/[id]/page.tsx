import { notFound } from 'next/navigation';
import { prisma } from '@vargah/database';
import { Badge } from '@vargah/ui/components/badge';
import { PageHeader } from '@/components/ui/data-table';
import { ArticleEditForm } from '@/components/content/article-edit-form';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { ARTICLE_STATUS_LABELS, ARTICLE_STATUS_VARIANT } from '@/lib/articles/constants';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
type Props = { params: Promise<{ id: string }> };

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

export default async function EditArticlePage({ params }: Props) {
  await requirePermission(PERMISSIONS.ARTICLE_EDIT);
  const session = await requireAuth();
  const { id } = await params;

  const [article, categories, versions, mediaAssets] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.articleVersion.findMany({
      where: { articleId: id },
      orderBy: { version: 'desc' },
      include: { author: { select: { name: true } } },
    }),
    getMediaAssets(),
  ]);

  if (!article) notFound();

  const canDelete = await hasPermissionAsync(session.user.role, PERMISSIONS.ARTICLE_DELETE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ویرایش مقاله"
        description={article.title}
        backHref="/content/articles"
        backLabel="بازگشت به مقالات"
        action={
          <Badge variant={ARTICLE_STATUS_VARIANT[article.status]}>
            {ARTICLE_STATUS_LABELS[article.status]}
          </Badge>
        }
      />
      <ArticleEditForm
        article={article}
        categories={categories}
        versions={versions}
        canDelete={canDelete}
        mediaAssets={mediaAssets}
      />
    </div>
  );
}
