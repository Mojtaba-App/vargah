import { prisma, IssueStatus } from '@vargah/database';

import { mockImages } from '@/data/mock/images';
import type { Issue } from '@/data/types';
import { dayjs, toIsoString } from '@/lib/date';

export type IssueArchiveItem = Issue & {
  articleCount: number;
  jalaliYear: number;
  jalaliMonth: number;
};

const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export function getJalaliParts(date: Date | string | null | undefined) {
  if (!date) return null;
  const j = dayjs(date).calendar('jalali');
  return {
    year: j.year(),
    month: j.month() + 1,
    monthLabel: JALALI_MONTHS[j.month()] ?? '',
  };
}

function mapDbIssue(
  row: Awaited<ReturnType<typeof fetchPublishedIssuesFromDb>>[number],
): IssueArchiveItem {
  const publishedAt = toIsoString(row.publishedAt) ?? toIsoString(row.createdAt)!;
  const jalali = getJalaliParts(publishedAt)!;

  return {
    id: row.id,
    slug: row.slug,
    number: row.number,
    title: row.title,
    coverImage: row.coverImage || mockImages.issueCover,
    publishedAt,
    pageCount: row.pageCount,
    pdfUrl: row.pdfUrl || '',
    description: row.description ?? '',
    articleIds: row.articles.map((a) => a.id),
    articleCount: row.articles.length,
    jalaliYear: jalali.year,
    jalaliMonth: jalali.month,
  };
}

async function fetchPublishedIssuesFromDb() {
  return prisma.issue.findMany({
    where: { status: IssueStatus.PUBLISHED },
    orderBy: [{ publishedAt: 'desc' }, { number: 'desc' }],
    include: {
      articles: {
        where: { status: 'PUBLISHED' },
        select: { id: true },
      },
    },
  });
}

export async function getIssueArchiveItems(): Promise<IssueArchiveItem[]> {
  try {
    if (!process.env.DATABASE_URL) return [];
    const rows = await fetchPublishedIssuesFromDb();
    return rows.map(mapDbIssue);
  } catch (error) {
    console.error('[issues-archive] DB load failed:', error);
    return [];
  }
}

export function mapMockIssue(issue: Issue): IssueArchiveItem {
  const jalali = getJalaliParts(issue.publishedAt)!;
  return {
    ...issue,
    articleCount: issue.articleIds.length,
    jalaliYear: jalali.year,
    jalaliMonth: jalali.month,
  };
}

export function filterIssueArchive(
  items: IssueArchiveItem[],
  year?: number,
  month?: number,
): IssueArchiveItem[] {
  return items.filter((issue) => {
    if (year && issue.jalaliYear !== year) return false;
    if (month && issue.jalaliMonth !== month) return false;
    return true;
  });
}

export function getIssueArchiveYears(items: IssueArchiveItem[]): number[] {
  return [...new Set(items.map((i) => i.jalaliYear))].sort((a, b) => b - a);
}

export function getIssueCountByYear(items: IssueArchiveItem[], year: number): number {
  return items.filter((i) => i.jalaliYear === year).length;
}

export function formatJalaliMonthLabel(month: number): string {
  return JALALI_MONTHS[month - 1] ?? '';
}

export { JALALI_MONTHS };
