import type { DbArticle } from './articles';
import type { Article } from '@/data/types';
import { estimateReadingMinutes } from '@vargah/business/reading-time';
import { toIsoString } from '@/lib/date';

const FALLBACK_COVER = '/images/hero-vargah.jpg';

export function mapDbArticleToView(article: DbArticle): Article {
  const readingTimeMinutes =
    article.readingTime > 0 ? article.readingTime : estimateReadingMinutes(article.content);

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt ?? '',
    content: article.content,
    coverImage: article.coverImage || article.ogImage || FALLBACK_COVER,
    categoryId: article.categoryId ?? '',
    categoryName: article.category?.name,
    categorySlug: article.category?.slug,
    tagIds: article.tags.map((t) => t.tagId),
    authorId: article.authorId,
    authorName: article.author.name ?? 'وارگه',
    issueId: article.issueId ?? undefined,
    publishedAt: toIsoString(article.publishedAt) ?? toIsoString(article.createdAt)!,
    readingTimeMinutes,
    isEditorsPick: article.isEditorsPick,
    isFeatured: article.isFeatured,
  };
}

export function getDbArticleMeta(article: DbArticle) {
  return {
    author: {
      name: article.author.name ?? 'وارگه',
      avatar: article.author.image,
    },
    category: article.category
      ? { slug: article.category.slug, name: article.category.name }
      : undefined,
    tags: article.tags.map((t) => ({
      id: t.tag.id,
      slug: t.tag.slug,
      name: t.tag.name,
    })),
  };
}
