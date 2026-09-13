import Link from 'next/link';

import { FileStackIcon } from '@/components/dashboard/dashboard-icons';
import { formatNumber } from '@/lib/utils';

type TopArticle = {
  id: string;
  title: string;
  slug: string;
  views: number;
};

export function TopArticlesTable({ articles }: { articles: TopArticle[] }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-bold">پربازدیدترین مطالب</h2>
        <span className="text-xs text-muted-foreground">۳۰ روز اخیر</span>
      </div>

      {articles.length === 0 ? (
        <p className="rounded-xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
          هنوز داده بازدیدی ثبت نشده است
        </p>
      ) : (
        <div className="space-y-2">
          {articles.map((article, index) => (
            <Link
              key={article.id}
              href={`/content/articles/${article.id}`}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/15 px-3 py-3 transition-colors hover:bg-muted/35"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-sm font-medium">{article.title}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <FileStackIcon className="size-3.5" />
                  {formatNumber(article.views)} بازدید
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
