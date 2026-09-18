import { unstable_cache } from 'next/cache';
import { prisma, ArticleStatus } from '@vargah/database';

import { mapDbArticleToView } from '@/lib/db/map-article';
import type { Article } from '@/data/types';

const articleInclude = {
  author: { select: { id: true, name: true, image: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} as const;

export type DbArticle = NonNullable<Awaited<ReturnType<typeof getPublishedArticleBySlug>>>;

export async function getPublishedArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, status: ArticleStatus.PUBLISHED },
    include: articleInclude,
  });
}

export const getCachedPublishedArticleBySlug = (slug: string) =>
  unstable_cache(() => getPublishedArticleBySlug(slug), ['article', slug], {
    tags: ['articles', `article:${slug}`],
    revalidate: 3600,
  })();

export async function getPublishedArticleSlugs() {
  const rows = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    select: { slug: true },
    orderBy: { publishedAt: 'desc' },
  });
  return rows.map((r) => r.slug);
}

export const getCachedPublishedArticleSlugs = unstable_cache(
  getPublishedArticleSlugs,
  ['article-slugs'],
  { tags: ['articles'], revalidate: 3600 },
);

export async function getRelatedPublishedArticles(
  articleId: string,
  categoryId: string | null,
  limit = 4,
) {
  return prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      id: { not: articleId },
      ...(categoryId ? { categoryId } : {}),
    },
    include: articleInclude,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

export async function getPublishedArticles(limit = 40) {
  return prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    include: articleInclude,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
}

export const getCachedPublishedArticles = unstable_cache(
  () => getPublishedArticles(40),
  ['published-articles'],
  { tags: ['articles'], revalidate: 3600 },
);

export async function getEditorsPickArticles(limit = 4) {
  const picks = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED, isEditorsPick: true },
    include: articleInclude,
    orderBy: [{ publishedAt: 'desc' }],
    take: limit,
  });
  if (picks.length > 0) return picks;

  const featured = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED, isFeatured: true },
    include: articleInclude,
    orderBy: [{ publishedAt: 'desc' }],
    take: limit,
  });
  if (featured.length > 0) return featured;

  return getPublishedArticles(limit);
}

export const getCachedEditorsPickArticles = unstable_cache(
  () => getEditorsPickArticles(4),
  ['editors-pick-articles'],
  { tags: ['articles'], revalidate: 3600 },
);

export type CategoryArticleGroup = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  articles: Article[];
};

export async function getLatestArticlesGroupedByCategory(limitPerCategory = 3, maxGroups = 3) {
  const rows = await getPublishedArticles(60);
  const mapped = rows.map(mapDbArticleToView);
  const groups = new Map<string, CategoryArticleGroup>();

  for (const article of mapped) {
    if (!article.categoryId || !article.categoryName || !article.categorySlug) continue;
    const existing = groups.get(article.categoryId);
    if (existing) {
      if (existing.articles.length < limitPerCategory) existing.articles.push(article);
      continue;
    }
    if (groups.size >= maxGroups) continue;
    groups.set(article.categoryId, {
      categoryId: article.categoryId,
      categoryName: article.categoryName,
      categorySlug: article.categorySlug,
      articles: [article],
    });
  }

  return Array.from(groups.values());
}

export const getCachedLatestArticlesGrouped = unstable_cache(
  () => getLatestArticlesGroupedByCategory(3, 3),
  ['latest-articles-grouped'],
  { tags: ['articles'], revalidate: 3600 },
);

export async function searchPublishedArticles(filters: {
  query?: string;
  categorySlug?: string;
  tagSlug?: string;
  limit?: number;
}): Promise<Article[]> {
  const query = filters.query?.trim();
  const rows = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
      ...(filters.tagSlug ? { tags: { some: { tag: { slug: filters.tagSlug } } } } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { excerpt: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: articleInclude,
    orderBy: [{ publishedAt: 'desc' }],
    take: filters.limit ?? 60,
  });

  return rows.map(mapDbArticleToView);
}

export const getCachedSearchPublishedArticles = (filters: {
  query?: string;
  categorySlug?: string;
  tagSlug?: string;
}) =>
  unstable_cache(
    () => searchPublishedArticles(filters),
    ['search-articles', filters.query ?? '', filters.categorySlug ?? '', filters.tagSlug ?? ''],
    { tags: ['articles'], revalidate: 600 },
  )();
