import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getAuthorById } from '@/data/mock/authors';
import { getAllCategoriesFlat } from '@/data/mock/categories';
import { getTagsByIds } from '@/data/mock/tags';
import { formatJalaliDate } from '@/lib/date';
import { TagList } from './tag-list';
import type { Article } from '@/data/types';

type ArticleMetaProps = {
  article: Article;
  author?: { name: string; avatar?: string | null };
  category?: { slug: string; name: string };
  tags?: { id: string; slug: string; name: string }[];
};

export function ArticleMeta({
  article,
  author: authorProp,
  category: categoryProp,
  tags: tagsProp,
}: ArticleMetaProps) {
  const author = authorProp ?? getAuthorById(article.authorId);
  const categories = getAllCategoriesFlat();
  const category = categoryProp ?? categories.find((c) => c.id === article.categoryId);
  const articleTags = tagsProp ?? getTagsByIds(article.tagIds);

  return (
    <div className="border-border space-y-4 border-b pb-6">
      {category && (
        <Link
          href={`/articles/category/${category.slug}`}
          className="text-primary text-sm font-medium"
        >
          {category.name}
        </Link>
      )}
      <h1 className="text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">{article.title}</h1>
      <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
        {author && (
          <span className="flex items-center gap-2">
            {'avatar' in author && author.avatar && (
              <Image
                src={author.avatar}
                alt={author.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span>{author.name}</span>
          </span>
        )}
        <span>{formatJalaliDate(article.publishedAt, 'D MMMM YYYY')}</span>
        <span>{article.readingTimeMinutes} دقیقه مطالعه</span>
      </div>
      <TagList tagIds={articleTags.map((t) => t.id)} tags={tagsProp} />
    </div>
  );
}
