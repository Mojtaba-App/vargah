import { SectionTitle } from '@/components/shared/section-title';
import { ArticleCard } from './article-card';
import type { Article } from '@/data/types';

type RelatedArticlesProps = {
  articles: Article[];
};

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section>
      <SectionTitle title="مطالب مرتبط" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="compact" />
        ))}
      </div>
    </section>
  );
}
