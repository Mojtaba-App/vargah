import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';
import { SectionTitle } from '@/components/shared/section-title';
import { FadeIn } from '@/components/motion/fade-in';
import {
  JobOpeningsGrid,
  WritingGuidelinesGrid,
} from '@/components/collaborate/collaborate-sections';
import { ArticleSubmissionForm } from '@/components/forms/article-submission-form';
import { CollaborationApplicationForm } from '@/components/forms/collaboration-application-form';
import { getPublicServicesContent } from '@/lib/services-content';

export const dynamic = 'force-dynamic';

export default async function CollaboratePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const services = await getPublicServicesContent();
  const { collaborate } = services;

  return (
    <>
      <PageHeader title={collaborate.title} description={collaborate.description} />
      <Container className="py-12 sm:py-14">
        <div className="mb-14 grid gap-8 lg:grid-cols-2 lg:gap-10">
          <FadeIn>
            <section className="border-border bg-card/80 h-full rounded-[1.75rem] border p-6 shadow-sm sm:p-8">
              <SectionTitle
                title={collaborate.formTitle}
                subtitle={collaborate.formSubtitle}
                className="mb-6"
              />
              <ArticleSubmissionForm />
            </section>
          </FadeIn>

          <FadeIn delay={0.05}>
            <section className="border-primary/20 from-primary/5 via-card to-card h-full rounded-[1.75rem] border bg-gradient-to-br p-6 shadow-sm sm:p-8">
              <SectionTitle
                title={collaborate.resumeTitle}
                subtitle={collaborate.resumeSubtitle}
                className="mb-6"
              />
              <CollaborationApplicationForm types={collaborate.collaborationTypes} />
            </section>
          </FadeIn>
        </div>

        <section className="mb-14">
          <SectionTitle title={collaborate.jobsTitle} subtitle={collaborate.jobsSubtitle} />
          <JobOpeningsGrid jobs={collaborate.jobs} />
        </section>

        <section>
          <SectionTitle
            title={collaborate.guidelinesTitle}
            subtitle={collaborate.guidelinesSubtitle}
          />
          <WritingGuidelinesGrid guidelines={collaborate.guidelines} />
        </section>
      </Container>
    </>
  );
}
