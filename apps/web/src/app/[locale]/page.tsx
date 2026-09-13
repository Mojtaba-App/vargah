import { setRequestLocale } from 'next-intl/server';

import { getLatestIssue } from '@/data/mock/issues';
import type { Issue } from '@/data/types';
import { HeroSection } from '@/components/home/hero-section';
import { LatestIssueSection } from '@/components/home/latest-issue-section';
import { EditorsPickSection } from '@/components/home/editors-pick-section';
import { LatestArticlesSection } from '@/components/home/latest-articles-section';
import { MagazineIntroSection } from '@/components/home/magazine-intro-section';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { getPublicAboutContent } from '@/lib/about-content';
import { getSiteConfig } from '@/lib/site-config';
import {
  getCachedEditorsPickArticles,
  getCachedLatestArticlesGrouped,
} from '@/lib/db/articles';
import { getCachedLatestPublishedIssue } from '@/lib/db/issues';
import { mapDbArticleToView } from '@/lib/db/map-article';
import { mockImages } from '@/data/mock/images';
import { toIsoString } from '@/lib/date';

function mapLatestIssue(
  row: NonNullable<Awaited<ReturnType<typeof getCachedLatestPublishedIssue>>>,
): Issue {
  return {
    id: row.id,
    slug: row.slug,
    number: row.number,
    title: row.title,
    coverImage: row.coverImage || mockImages.issueCover,
    publishedAt: toIsoString(row.publishedAt) ?? toIsoString(row.createdAt)!,
    pageCount: row.pageCount,
    pdfUrl: row.pdfUrl || '',
    description: row.description ?? '',
    articleIds: row.articles.map((a) => a.id),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [about, siteConfig, editorsPickRows, grouped, latestDb] = await Promise.all([
    getPublicAboutContent(),
    getSiteConfig(),
    getCachedEditorsPickArticles().catch(() => []),
    getCachedLatestArticlesGrouped().catch(() => []),
    getCachedLatestPublishedIssue().catch(() => null),
  ]);

  const editorsPicks = editorsPickRows.map(mapDbArticleToView);
  const latestIssue =
    latestDb != null
      ? mapLatestIssue(latestDb)
      : process.env.NODE_ENV === 'production'
        ? null
        : getLatestIssue();

  return (
    <>
      <HeroSection />
      {latestIssue ? <LatestIssueSection issue={latestIssue} /> : null}
      <EditorsPickSection articles={editorsPicks} />
      <LatestArticlesSection groups={grouped} />
      <MagazineIntroSection intro={about.intro} stats={about.stats} />
      <NewsletterForm content={siteConfig.newsletter} />
    </>
  );
}
