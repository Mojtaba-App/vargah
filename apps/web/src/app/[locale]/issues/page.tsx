import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';
import { IssueCard } from '@/components/issues/issue-card';
import { IssueFilter } from '@/components/issues/issue-filter';
import { issues as mockIssues } from '@/data/mock/issues';
import {
  filterIssueArchive,
  getIssueArchiveItems,
  getIssueArchiveYears,
  getIssueCountByYear,
  mapMockIssue,
} from '@/lib/issues-archive';
import { formatNumber } from '@/lib/utils';

type IssuesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function IssuesPage({ params, searchParams }: IssuesPageProps) {
  const { locale } = await params;
  const { year: yearParam, month: monthParam } = await searchParams;
  setRequestLocale(locale);

  const selectedYear = yearParam ? parseInt(yearParam, 10) : undefined;
  const selectedMonth = monthParam ? parseInt(monthParam, 10) : undefined;

  const dbItems = await getIssueArchiveItems();
  const allItems =
    dbItems.length > 0
      ? dbItems
      : process.env.NODE_ENV === 'production'
        ? []
        : mockIssues.map(mapMockIssue);

  const years = getIssueArchiveYears(allItems);
  const yearCounts = Object.fromEntries(years.map((y) => [y, getIssueCountByYear(allItems, y)]));
  const filteredIssues = filterIssueArchive(allItems, selectedYear, selectedMonth);

  return (
    <>
      <PageHeader
        eyebrow="مجموعه"
        title="آرشیو شماره‌ها"
        description="تمام شماره‌های منتشرشده ماهنامه — با امکان فیلتر بر اساس سال و ماه"
      />
      <Container className="py-12 sm:py-14">
        <IssueFilter
          years={years}
          yearCounts={yearCounts}
          totalCount={allItems.length}
          filteredCount={filteredIssues.length}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          className="mb-8"
        />

        {filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-lg font-medium">شماره‌ای با این فیلتر یافت نشد</p>
            <p className="mt-2 text-sm text-muted-foreground">
              سال یا ماه دیگری انتخاب کنید یا فیلترها را پاک کنید.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              نمایش {formatNumber(filteredIssues.length)} شماره
              {selectedYear || selectedMonth ? ' (فیلترشده)' : ''}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredIssues.map((issue, index) => (
                <IssueCard key={issue.id} issue={issue} priority={index < 4} />
              ))}
            </div>
          </>
        )}
      </Container>
    </>
  );
}
