import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';
import { SearchBar } from '@/components/articles/search-bar';
import { CategoryNav } from '@/components/articles/category-nav';
import { TagList } from '@/components/articles/tag-list';
import { ArticleCard } from '@/components/articles/article-card';
import { getCachedSearchPublishedArticles } from '@/lib/db/articles';
import { getCachedCategoryTree, getCachedPublicTags } from '@/lib/db/taxonomy';

type ArticlesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; tag?: string }>;
};

export default async function ArticlesPage({ params, searchParams }: ArticlesPageProps) {
  const { locale } = await params;
  const { q, category, tag } = await searchParams;
  setRequestLocale(locale);

  const [results, categories, tags] = await Promise.all([
    getCachedSearchPublishedArticles({
      query: q,
      categorySlug: category,
      tagSlug: tag,
    }).catch(() => []),
    getCachedCategoryTree().catch(() => []),
    getCachedPublicTags().catch(() => []),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="آرشیو"
        title="مقالات و اخبار"
        description="آرشیو مقالات ماهنامه با جستجوی پیشرفته فارسی و دسته‌بندی موضوعی"
      />
      <Container className="py-12 sm:py-14">
        <div className="mb-8">
          <SearchBar defaultQuery={q} />
        </div>
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:order-1 lg:col-span-3">
            {q && (
              <p className="mb-4 text-sm text-muted-foreground">
                {results.length} نتیجه برای «{q}»
              </p>
            )}
            {results.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">مقاله‌ای یافت نشد.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {results.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
          <aside className="lg:order-2 lg:col-span-1">
            <h2 className="mb-3 text-sm font-semibold">دسته‌بندی</h2>
            <CategoryNav categories={categories} activeSlug={category} className="mb-8" />
            <h2 className="mb-3 text-sm font-semibold">برچسب‌ها</h2>
            <TagList tags={tags} activeSlug={tag} />
          </aside>
        </div>
      </Container>
    </>
  );
}
