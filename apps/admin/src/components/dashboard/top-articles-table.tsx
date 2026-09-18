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
    <section className="border-border/80 bg-card rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-bold">پربازدیدترین مطالب</h2>
        <span className="text-muted-foreground text-xs">۳۰ روز اخیر</span>
      </div>

      {articles.length === 0 ? (
        <p className="bg-muted/40 text-muted-foreground rounded-xl px-4 py-8 text-center text-sm">
          هنوز داده بازدیدی ثبت نشده است
        </p>
      ) : (
        <div className="space-y-2">
          {articles.map((article, index) => (
            <Link
              key={article.id}
              href={`/content/articles/${article.id}`}
              className="border-border/60 bg-muted/15 hover:bg-muted/35 flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors"
            >
              <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-sm font-medium">{article.title}</span>
                <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
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
