import { Link } from '@/i18n/navigation';
import { parseIssueTocEntries } from '@vargah/business/issue-toc';
import { getArticlesByIssue } from '@/data/mock/articles';
import type { Issue } from '@/data/types';

type TocArticle = {
  id: string;
  slug: string;
  title: string;
  readingTimeMinutes?: number;
  readingTime?: number;
  page?: number;
};

type IssueTocProps = {
  issue: Issue;
  articles?: TocArticle[];
  tableOfContents?: unknown;
};

export function IssueToc({ issue, articles, tableOfContents }: IssueTocProps) {
  const mockArticles = getArticlesByIssue(issue.id);
  const dbToc = parseIssueTocEntries(tableOfContents);

  const items: { key: string; href: string; title: string; meta: string; page?: number }[] = [];

  if (dbToc.length > 0) {
    for (const [index, entry] of dbToc.entries()) {
      const linked = articles?.find((a) => a.id === entry.articleId);
      items.push({
        key: `${entry.articleId ?? 'manual'}-${index}`,
        href: linked ? `/articles/${linked.slug}` : '#',
        title: entry.title,
        meta: entry.page
          ? `صفحه ${entry.page}`
          : linked
            ? `${linked.readingTime ?? linked.readingTimeMinutes ?? 5} دقیقه`
            : '',
        page: entry.page,
      });
    }
  } else if (articles && articles.length > 0) {
    for (const article of articles) {
      items.push({
        key: article.id,
        href: `/articles/${article.slug}`,
        title: article.title,
        meta: `${article.readingTime ?? article.readingTimeMinutes ?? 5} دقیقه مطالعه`,
      });
    }
  } else {
    for (const article of mockArticles) {
      items.push({
        key: article.id,
        href: `/articles/${article.slug}`,
        title: article.title,
        meta: `${article.readingTimeMinutes} دقیقه مطالعه`,
      });
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-bold">فهرست مطالب</h2>
        <p className="text-muted-foreground text-sm">فهرست مطالب این شماره هنوز ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">فهرست مطالب</h2>
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={item.key}>
            {item.href === '#' ? (
              <div className="flex items-start gap-3 rounded-lg p-2">
                <span className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.meta && <p className="text-muted-foreground text-xs">{item.meta}</p>}
                </div>
              </div>
            ) : (
              <Link
                href={item.href}
                className="hover:bg-muted flex items-start gap-3 rounded-lg p-2 transition-colors"
              >
                <span className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="hover:text-primary font-medium">{item.title}</p>
                  {item.meta && <p className="text-muted-foreground text-xs">{item.meta}</p>}
                </div>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
