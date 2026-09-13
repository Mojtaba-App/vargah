import { Link } from '@/i18n/navigation';
import { Container } from '@vargah/ui/components/container';
import { SectionTitle } from '@/components/shared/section-title';
import { ArticleCard } from '@/components/articles/article-card';
import type { CategoryArticleGroup } from '@/lib/db/articles';

type LatestArticlesSectionProps = {
  groups: CategoryArticleGroup[];
};

export function LatestArticlesSection({ groups }: LatestArticlesSectionProps) {
  if (groups.length === 0) return null;

  return (
    <section className="section-padding">
      <Container>
        <SectionTitle
          eyebrow="آرشیو مطالب"
          title="جدیدترین مقالات"
          subtitle="مرور سریع مطالب تازه بر اساس موضوع"
          action={
            <Link href="/articles" className="text-sm font-semibold text-primary hover:underline">
              همه مقالات
            </Link>
          }
        />
        <div className="space-y-12">
          {groups.map((group, index) => (
            <div key={group.categoryId}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-bold sm:text-xl">{group.categoryName}</h3>
                </div>
                <Link
                  href={`/articles/category/${group.categorySlug}`}
                  className="text-xs font-semibold text-primary hover:underline sm:text-sm"
                >
                  بیشتر
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="compact" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
