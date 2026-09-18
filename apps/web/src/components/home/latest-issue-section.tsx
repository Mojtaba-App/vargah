import { Link } from '@/i18n/navigation';
import { Container } from '@vargah/ui/components/container';
import { Button } from '@vargah/ui/components/button';
import { SectionTitle } from '@/components/shared/section-title';
import { IssueToc } from '@/components/issues/issue-toc';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { FadeIn } from '@/components/motion/fade-in';
import { MotionLinkArrow } from '@/components/motion/fade-in';
import { formatJalaliDate } from '@/lib/date';
import type { Issue } from '@/data/types';

type LatestIssueSectionProps = {
  issue: Issue;
};

export function LatestIssueSection({ issue }: LatestIssueSectionProps) {
  return (
    <section className="section-padding relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_55%)] opacity-60"
        aria-hidden="true"
      />
      <Container className="relative">
        <SectionTitle
          eyebrow="شماره جاری"
          title="آخرین شماره"
          subtitle={`شماره ${issue.number} — ${formatJalaliDate(issue.publishedAt, 'MMMM YYYY')}`}
          action={
            <Link
              href={`/issues/${issue.slug}`}
              className="group text-primary text-sm font-semibold"
            >
              <MotionLinkArrow>مشاهده همه مطالب</MotionLinkArrow>
            </Link>
          }
        />
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <FadeIn className="lg:col-span-5">
            <div className="surface-card relative mx-auto max-w-sm overflow-hidden rounded-3xl p-3 lg:mx-0">
              <OptimizedImage
                src={issue.coverImage}
                alt={`کاور ${issue.title}`}
                fill
                wrapperClassName="aspect-[3/4] w-full overflow-hidden rounded-2xl"
                sizes="(max-width:1024px) 100vw, 420px"
                priority
                className="transition-transform duration-500 hover:scale-[1.02]"
              />
              <div className="bg-primary text-primary-foreground absolute start-6 top-6 rounded-full px-3 py-1 text-xs font-bold shadow-md">
                شماره {issue.number}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.1} className="flex flex-col lg:col-span-7">
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{issue.title}</h3>
            <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
              {issue.description}
            </p>
            <p className="bg-muted text-muted-foreground mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium">
              {issue.pageCount} صفحه · PDF و مطالعه آنلاین
            </p>
            <div className="surface-card mt-6 flex-1 rounded-2xl p-5 sm:p-6">
              <IssueToc issue={issue} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/issues/${issue.slug}`}>
                <Button size="lg" className="rounded-full px-7">
                  مطالعه آنلاین
                </Button>
              </Link>
              <a href={issue.pdfUrl} download>
                <Button variant="outline" size="lg" className="rounded-full px-7">
                  دانلود PDF
                </Button>
              </a>
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
