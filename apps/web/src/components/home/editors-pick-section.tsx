import { Link } from '@/i18n/navigation';
import { Container } from '@vargah/ui/components/container';
import { SectionTitle } from '@/components/shared/section-title';
import { ArticleCard } from '@/components/articles/article-card';
import { FadeIn } from '@/components/motion/fade-in';
import type { Article } from '@/data/types';

type EditorsPickSectionProps = {
  articles: Article[];
};

export function EditorsPickSection({ articles }: EditorsPickSectionProps) {
  if (articles.length === 0) return null;

  const [featured, ...rest] = articles;

  return (
    <section className="section-padding border-y border-border bg-muted/20">
      <Container>
        <SectionTitle
          eyebrow="انتخاب ویژه"
          title="برگزیده سردبیر"
          subtitle="تحلیل‌ها و گزارش‌هایی که نباید از دست بدهید"
        />
        <div className="grid gap-6 lg:grid-cols-12">
          {featured && (
            <FadeIn className="lg:col-span-7">
              <ArticleCard article={featured} variant="featured" priority />
            </FadeIn>
          )}
          <div className="grid gap-4 lg:col-span-5">
            {rest.map((article, index) => (
              <FadeIn key={article.id} delay={0.05 * (index + 1)}>
                <ArticleCard article={article} variant="horizontal" />
              </FadeIn>
            ))}
          </div>
        </div>
        <div className="mt-6 text-end">
          <Link href="/articles" className="text-sm font-semibold text-primary hover:underline">
            مشاهده همه مقالات
          </Link>
        </div>
      </Container>
    </section>
  );
}
