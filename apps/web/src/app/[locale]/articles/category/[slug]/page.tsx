import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';
import { CategoryNav } from '@/components/articles/category-nav';
import { ArticleCard } from '@/components/articles/article-card';
import { Breadcrumb } from '@/components/shared/breadcrumb';
import { getCachedSearchPublishedArticles } from '@/lib/db/articles';
import { getCachedCategoryBySlug, getCachedCategoryTree } from '@/lib/db/taxonomy';

type CategoryPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [category, results, categories] = await Promise.all([
    getCachedCategoryBySlug(slug).catch(() => null),
    getCachedSearchPublishedArticles({ categorySlug: slug }).catch(() => []),
    getCachedCategoryTree().catch(() => []),
  ]);

  if (!category) notFound();

  return (
    <>
      <PageHeader title={category.name} description={`مقالات دسته ${category.name}`} />
      <Container className="py-10">
        <Breadcrumb
          items={[
            { label: 'خانه', href: '/' },
            { label: 'مقالات', href: '/articles' },
            { label: category.name },
          ]}
          className="mb-6"
        />
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:order-1 lg:col-span-3">
            {results.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">مقاله‌ای در این دسته نیست.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {results.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
          <aside className="lg:order-2 lg:col-span-1">
            <CategoryNav categories={categories} activeSlug={slug} />
          </aside>
        </div>
      </Container>
    </>
  );
}
