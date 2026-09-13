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

export function ArticleMeta({ article, author: authorProp, category: categoryProp, tags: tagsProp }: ArticleMetaProps) {
  const author = authorProp ?? getAuthorById(article.authorId);
  const categories = getAllCategoriesFlat();
  const category = categoryProp ?? categories.find((c) => c.id === article.categoryId);
  const articleTags = tagsProp ?? getTagsByIds(article.tagIds);

  return (
    <div className="space-y-4 border-b border-border pb-6">
      {category && (
        <Link href={`/articles/category/${category.slug}`} className="text-sm font-medium text-primary">
          {category.name}
        </Link>
      )}
      <h1 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{article.title}</h1>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {author && (
          <span className="flex items-center gap-2">
            {'avatar' in author && author.avatar && (
              <Image src={author.avatar} alt={author.name} width={32} height={32} className="rounded-full" />
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
