import { Link } from '@/i18n/navigation';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { Badge } from '@vargah/ui/components/badge';
import { getAuthorById } from '@/data/mock/authors';
import { getAllCategoriesFlat } from '@/data/mock/categories';
import { formatJalaliDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Article } from '@/data/types';

type ArticleCardProps = {
  article: Article;
  variant?: 'default' | 'compact' | 'horizontal' | 'featured';
  className?: string;
  priority?: boolean;
};

function resolveArticleMeta(article: Article) {
  const authorName = article.authorName ?? getAuthorById(article.authorId)?.name ?? 'وارگه';
  const categoryName =
    article.categoryName ?? getAllCategoriesFlat().find((c) => c.id === article.categoryId)?.name;
  return { authorName, categoryName };
}

export function ArticleCard({
  article,
  variant = 'default',
  className,
  priority = false,
}: ArticleCardProps) {
  const { authorName, categoryName } = resolveArticleMeta(article);

  if (variant === 'featured') {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className={cn(
          'group surface-card relative flex min-h-[22rem] flex-col overflow-hidden sm:min-h-[26rem]',
          className,
        )}
      >
        <OptimizedImage
          src={article.coverImage}
          alt={article.title}
          fill
          wrapperClassName="absolute inset-0"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width:1024px) 100vw, 60vw"
          priority={priority}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          aria-hidden="true"
        />
        <div className="relative mt-auto p-6 text-white sm:p-8">
          {categoryName && (
            <Badge className="mb-3 bg-white/15 text-white backdrop-blur-sm">{categoryName}</Badge>
          )}
          <h3 className="text-2xl leading-snug font-bold text-balance sm:text-3xl">
            {article.title}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/80 sm:text-base">
            {article.excerpt}
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs text-white/70 sm:text-sm">
            <span>{authorName}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>
              {formatJalaliDate(article.publishedAt, 'D MMMM')}
            </time>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className={cn('group surface-card flex gap-4 p-3 sm:p-4', className)}
      >
        <OptimizedImage
          src={article.coverImage}
          alt=""
          role="presentation"
          fill
          wrapperClassName="h-24 w-28 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-32"
          sizes="128px"
          priority={priority}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          {categoryName && (
            <Badge variant="default" className="mb-2 w-fit">
              {categoryName}
            </Badge>
          )}
          <h3 className="group-hover:text-primary line-clamp-2 text-base leading-snug font-semibold">
            {article.title}
          </h3>
          <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs leading-relaxed sm:text-sm">
            {article.excerpt}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {authorName} · {article.readingTimeMinutes} دقیقه
          </p>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/articles/${article.slug}`} className={cn('group block', className)}>
        <div className="surface-card overflow-hidden p-2">
          <OptimizedImage
            src={article.coverImage}
            alt={article.title}
            fill
            wrapperClassName="aspect-[16/10] overflow-hidden rounded-xl"
            className="transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 33vw"
            priority={priority}
          />
          <h3 className="group-hover:text-primary mt-3 line-clamp-2 px-1 text-sm leading-snug font-semibold">
            {article.title}
          </h3>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={cn('group surface-card flex flex-col overflow-hidden', className)}
    >
      <div className="relative overflow-hidden">
        <OptimizedImage
          src={article.coverImage}
          alt={article.title}
          fill
          wrapperClassName="aspect-[16/10]"
          className="transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
          priority={priority}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
        {categoryName && (
          <Badge className="bg-background/90 text-foreground absolute start-3 top-3 backdrop-blur-sm">
            {categoryName}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="group-hover:text-primary line-clamp-2 text-lg leading-snug font-semibold">
          {article.title}
        </h3>
        <p className="text-muted-foreground mt-2 line-clamp-2 flex-1 text-sm leading-relaxed">
          {article.excerpt}
        </p>
        <div className="border-border/70 text-muted-foreground mt-4 flex items-center justify-between border-t pt-4 text-xs">
          <span>{authorName}</span>
          <div className="flex items-center gap-2">
            <span>{article.readingTimeMinutes} دقیقه</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>
              {formatJalaliDate(article.publishedAt, 'D MMMM')}
            </time>
          </div>
        </div>
      </div>
    </Link>
  );
}
