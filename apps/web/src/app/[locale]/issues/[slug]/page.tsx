import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';
import { Button } from '@vargah/ui/components/button';
import { buildPublicationIssueJsonLd, buildPeriodicalJsonLd, absoluteUrl } from '@vargah/seo';

import { Breadcrumb } from '@/components/shared/breadcrumb';
import { IssueToc } from '@/components/issues/issue-toc';
import { PdfViewerLazy } from '@/components/issues/pdf-viewer-lazy';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { FadeIn } from '@/components/motion/fade-in';
import { JsonLd } from '@/components/seo/json-ld';
import { getIssueBySlug, issues } from '@/data/mock/issues';
import { formatJalaliDate, toIsoString } from '@/lib/date';
import { getCachedPublishedIssueBySlug, getCachedPublishedIssueSlugs } from '@/lib/db/issues';

export const revalidate = 3600;

type IssueDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const dbSlugs = await getCachedPublishedIssueSlugs().catch(() => [] as string[]);
  if (process.env.NODE_ENV === 'production') {
    return dbSlugs.map((slug) => ({ slug }));
  }
  const mockSlugs = issues.map((i) => i.slug);
  const slugs = [...new Set([...dbSlugs, ...mockSlugs])];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: IssueDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dbIssue = await getCachedPublishedIssueBySlug(slug).catch(() => null);
  const mockIssue = process.env.NODE_ENV === 'production' ? null : getIssueBySlug(slug);

  const title = dbIssue?.title ?? mockIssue?.title;
  const description = dbIssue?.description ?? mockIssue?.description;
  const image = dbIssue?.coverImage ?? mockIssue?.coverImage;
  const canonical = absoluteUrl(`/issues/${encodeURIComponent(slug)}`);

  if (!title) return {};

  return {
    title,
    description: description ?? undefined,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      locale: 'fa_IR',
      url: canonical,
      title,
      description: description ?? undefined,
      images: image ? [{ url: image, width: 1200, height: 1600, alt: title }] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const dbIssue = await getCachedPublishedIssueBySlug(slug).catch(() => null);

  if (dbIssue) {
    const pdfUrl = dbIssue.pdfUrl ?? '#';
    const coverImage = dbIssue.coverImage ?? '/images/hero-vargah.jpg';
    const publishedAt = toIsoString(dbIssue.publishedAt) ?? new Date().toISOString();

    const jsonLd = [
      buildPeriodicalJsonLd({ number: dbIssue.number, title: 'وارگه', slug: 'vargah' }),
      buildPublicationIssueJsonLd({
        number: dbIssue.number,
        title: dbIssue.title,
        slug: dbIssue.slug,
        description: dbIssue.description,
        coverImage,
        pdfUrl: dbIssue.pdfUrl,
        publishedAt: dbIssue.publishedAt,
        pageCount: dbIssue.pageCount,
      }),
    ];

    const mockShape = {
      id: dbIssue.id,
      slug: dbIssue.slug,
      number: dbIssue.number,
      title: dbIssue.title,
      coverImage,
      publishedAt,
      pageCount: dbIssue.pageCount,
      pdfUrl,
      description: dbIssue.description ?? '',
      articleIds: dbIssue.articles.map((a) => a.id),
    };

    return (
      <>
        <JsonLd data={jsonLd} />
        <Container className="py-6">
          <Breadcrumb
            items={[
              { label: 'خانه', href: '/' },
              { label: 'شماره‌ها', href: '/issues' },
              { label: dbIssue.title },
            ]}
          />
        </Container>
        <Container className="pb-12">
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            <FadeIn delay={0.1} className="lg:order-1 lg:col-span-2">
              <PdfViewerLazy pdfUrl={pdfUrl} title={dbIssue.title} />
            </FadeIn>
            <FadeIn className="lg:order-2 lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <OptimizedImage
                  src={coverImage}
                  alt={`کاور ${dbIssue.title}`}
                  fill
                  wrapperClassName="mx-auto aspect-[3/4] max-w-xs overflow-hidden rounded-2xl shadow-lg"
                  sizes="320px"
                  priority
                />
                <div className="text-center lg:text-start">
                  <span className="text-primary text-sm font-medium">شماره {dbIssue.number}</span>
                  <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                    {dbIssue.title}
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm">
                    <time dateTime={publishedAt}>
                      {formatJalaliDate(publishedAt, 'D MMMM YYYY')}
                    </time>
                    {' · '}
                    {dbIssue.pageCount} صفحه
                  </p>
                  {dbIssue.description && (
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      {dbIssue.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                    <a href={pdfUrl} download>
                      <Button>دانلود PDF</Button>
                    </a>
                  </div>
                </div>
                <IssueToc
                  issue={mockShape}
                  articles={dbIssue.articles.map((a) => ({
                    id: a.id,
                    slug: a.slug,
                    title: a.title,
                    readingTime: a.readingTime,
                  }))}
                  tableOfContents={dbIssue.tableOfContents}
                />
              </div>
            </FadeIn>
          </div>
        </Container>
      </>
    );
  }

  if (process.env.NODE_ENV === 'production') notFound();

  const issue = getIssueBySlug(slug);
  if (!issue) notFound();

  return (
    <>
      <JsonLd
        data={buildPublicationIssueJsonLd({
          number: issue.number,
          title: issue.title,
          slug: issue.slug,
          description: issue.description,
          coverImage: issue.coverImage,
          pdfUrl: issue.pdfUrl,
          publishedAt: issue.publishedAt,
          pageCount: issue.pageCount,
        })}
      />
      <Container className="py-6">
        <Breadcrumb
          items={[
            { label: 'خانه', href: '/' },
            { label: 'شماره‌ها', href: '/issues' },
            { label: issue.title },
          ]}
        />
      </Container>
      <Container className="pb-12">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          <FadeIn delay={0.1} className="lg:order-1 lg:col-span-2">
            <PdfViewerLazy pdfUrl={issue.pdfUrl} title={issue.title} />
          </FadeIn>
          <FadeIn className="lg:order-2 lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <OptimizedImage
                src={issue.coverImage}
                alt={`کاور ${issue.title}`}
                fill
                wrapperClassName="mx-auto aspect-[3/4] max-w-xs overflow-hidden rounded-2xl shadow-lg"
                sizes="320px"
                priority
              />
              <div className="text-center lg:text-start">
                <span className="text-primary text-sm font-medium">شماره {issue.number}</span>
                <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{issue.title}</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  <time dateTime={issue.publishedAt}>
                    {formatJalaliDate(issue.publishedAt, 'D MMMM YYYY')}
                  </time>
                  {' · '}
                  {issue.pageCount} صفحه
                </p>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {issue.description}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                  <a href={issue.pdfUrl} download>
                    <Button>دانلود PDF</Button>
                  </a>
                </div>
              </div>
              <IssueToc issue={issue} />
            </div>
          </FadeIn>
        </div>
      </Container>
    </>
  );
}
