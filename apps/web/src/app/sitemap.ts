import { prisma, ArticleStatus, IssueStatus } from '@vargah/database';
import { getSiteUrl } from '@vargah/seo/site';
import type { MetadataRoute } from 'next';

const STATIC_PATHS = [
  '',
  '/articles',
  '/issues',
  '/about',
  '/contact',
  '/collaborate',
  '/advertising',
  '/subscription',
  '/legal/privacy',
  '/legal/terms',
  '/legal/submission-rules',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const [articles, issues, categories, tags] = await Promise.all([
    prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      select: { slug: true, updatedAt: true, publishedAt: true },
    }),
    prisma.issue.findMany({
      where: { status: IssueStatus.PUBLISHED },
      select: { slug: true, updatedAt: true, publishedAt: true },
    }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.tag.findMany({ select: { slug: true, createdAt: true } }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/articles/${encodeURIComponent(a.slug)}`,
    lastModified: a.updatedAt ?? a.publishedAt ?? now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const issueEntries: MetadataRoute.Sitemap = issues.map((i) => ({
    url: `${base}/issues/${encodeURIComponent(i.slug)}`,
    lastModified: i.updatedAt ?? i.publishedAt ?? now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/articles/category/${encodeURIComponent(c.slug)}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${base}/articles/tag/${encodeURIComponent(t.slug)}`,
    lastModified: t.createdAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticEntries, ...articleEntries, ...issueEntries, ...categoryEntries, ...tagEntries];
}
