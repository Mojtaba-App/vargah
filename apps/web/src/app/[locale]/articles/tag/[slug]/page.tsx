import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';
import { prisma } from '@vargah/database';

import { PageHeader } from '@/components/shared/page-header';
import { ArticleCard } from '@/components/articles/article-card';
import { Breadcrumb } from '@/components/shared/breadcrumb';
import { getCachedSearchPublishedArticles } from '@/lib/db/articles';

type TagPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function TagPage({ params }: TagPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tag = await prisma.tag
    .findFirst({
      where: { slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null);

  if (!tag) notFound();

  const results = await getCachedSearchPublishedArticles({ tagSlug: slug }).catch(() => []);

  return (
    <>
      <PageHeader title={`#${tag.name}`} description={`مقالات با برچسب ${tag.name}`} />
      <Container className="py-10">
        <Breadcrumb
          items={[
            { label: 'خانه', href: '/' },
            { label: 'مقالات', href: '/articles' },
            { label: `#${tag.name}` },
          ]}
          className="mb-6"
        />
        {results.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">مقاله‌ای با این برچسب نیست.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
