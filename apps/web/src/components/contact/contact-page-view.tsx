import type { ReactNode } from 'react';
import type { SiteContactSettings } from '@vargah/business/site-settings';
import { Container } from '@vargah/ui/components/container';

import { ContactForm } from '@/components/forms/contact-form';
import { FadeIn } from '@/components/motion/fade-in';
import { SiteMap } from '@/components/shared/site-map';
import { PageHeader } from '@/components/shared/page-header';
import { SectionTitle } from '@/components/shared/section-title';
import { cn } from '@/lib/utils';

type ContactPageViewProps = {
  contact: SiteContactSettings;
};

export function ContactPageView({ contact }: ContactPageViewProps) {
  const phoneHref = contact.phone.replace(/[\s-]/g, '');

  return (
    <>
      <PageHeader
        eyebrow={contact.pageEyebrow}
        title={contact.pageTitle}
        description={contact.pageDescription}
      />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <FadeIn>
            <section className="rounded-[1.75rem] border border-border bg-card/80 p-6 shadow-sm sm:p-8">
              <SectionTitle
                title={contact.formTitle}
                subtitle={contact.formSubtitle}
                className="mb-6 sm:mb-8"
              />
              <ContactForm />
              {contact.responseNote && (
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{contact.responseNote}</p>
              )}
            </section>
          </FadeIn>

          <div className="space-y-8">
            <FadeIn delay={0.06}>
              <section className="rounded-[1.75rem] border border-border bg-gradient-to-br from-accent/40 via-background to-muted/30 p-6 sm:p-8">
                <SectionTitle title={contact.infoTitle} className="mb-5 sm:mb-6" />
                <ul className="space-y-4">
                  <ContactInfoRow label="آدرس" value={contact.address} />
                  <ContactInfoRow
                    label="تلفن"
                    value={
                      <a href={`tel:${phoneHref}`} className="transition-colors hover:text-primary" dir="ltr">
                        {contact.phone}
                      </a>
                    }
                  />
                  <ContactInfoRow
                    label="ایمیل"
                    value={
                      <a
                        href={`mailto:${contact.email}`}
                        className="transition-colors hover:text-primary"
                        dir="ltr"
                      >
                        {contact.email}
                      </a>
                    }
                  />
                  {contact.workingHours && (
                    <ContactInfoRow label="ساعات پاسخگویی" value={contact.workingHours} />
                  )}
                </ul>
              </section>
            </FadeIn>

            <FadeIn delay={0.1}>
              <section className="rounded-[1.75rem] border border-border bg-card/80 p-6 shadow-sm sm:p-8">
                <SectionTitle title={contact.mapTitle} className="mb-5 sm:mb-6" />
                <SiteMap
                  contact={contact}
                  address={contact.address}
                  className="overflow-hidden rounded-2xl border-border/70"
                />
              </section>
            </FadeIn>
          </div>
        </div>
      </Container>
    </>
  );
}

function ContactInfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <li className="flex gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0">
      <span className="mt-0.5 w-28 shrink-0 text-sm font-medium text-foreground">{label}</span>
      <span className={cn('text-sm leading-relaxed text-muted-foreground')}>{value}</span>
    </li>
  );
}
