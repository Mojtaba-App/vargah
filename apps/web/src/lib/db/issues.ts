import { unstable_cache } from 'next/cache';
import { prisma, IssueStatus } from '@vargah/database';

export type DbIssue = NonNullable<Awaited<ReturnType<typeof getPublishedIssueBySlug>>>;

export async function getPublishedIssueBySlug(slug: string) {
  return prisma.issue.findFirst({
    where: { slug, status: IssueStatus.PUBLISHED },
    include: {
      articles: {
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, slug: true, readingTime: true },
        orderBy: { publishedAt: 'desc' },
      },
    },
  });
}

export const getCachedPublishedIssueBySlug = (slug: string) =>
  unstable_cache(
    () => getPublishedIssueBySlug(slug),
    ['issue', slug],
    { tags: ['issues', `issue:${slug}`], revalidate: 3600 },
  )();

export async function getPublishedIssueSlugs() {
  const rows = await prisma.issue.findMany({
    where: { status: IssueStatus.PUBLISHED },
    select: { slug: true },
    orderBy: { publishedAt: 'desc' },
  });
  return rows.map((r) => r.slug);
}

export const getCachedPublishedIssueSlugs = unstable_cache(
  getPublishedIssueSlugs,
  ['issue-slugs'],
  { tags: ['issues'], revalidate: 3600 },
);

export async function getPublishedIssues(limit = 12) {
  return prisma.issue.findMany({
    where: { status: IssueStatus.PUBLISHED },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

export async function getLatestPublishedIssue() {
  return prisma.issue.findFirst({
    where: { status: IssueStatus.PUBLISHED },
    orderBy: [{ publishedAt: 'desc' }, { number: 'desc' }],
    include: {
      articles: {
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, slug: true, readingTime: true },
        orderBy: { publishedAt: 'desc' },
      },
    },
  });
}

export const getCachedLatestPublishedIssue = unstable_cache(
  getLatestPublishedIssue,
  ['latest-published-issue'],
  { tags: ['issues'], revalidate: 3600 },
);

export const getCachedPublishedIssues = unstable_cache(
  () => getPublishedIssues(12),
  ['published-issues'],
  { tags: ['issues'], revalidate: 3600 },
);
