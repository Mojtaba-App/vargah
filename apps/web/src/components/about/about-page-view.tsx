import type { AboutContent } from '@vargah/business/about-content';
import { Container } from '@vargah/ui/components/container';
import { Button } from '@vargah/ui/components/button';
import { Link } from '@/i18n/navigation';
import { TeamCard } from '@/components/about/team-card';
import { FadeIn } from '@/components/motion/fade-in';
import { PageHeader } from '@/components/shared/page-header';
import { SectionTitle } from '@/components/shared/section-title';
import { StatCard } from '@/components/shared/stat-card';

type AboutPageViewProps = {
  content: AboutContent;
};

export function AboutPageView({ content }: AboutPageViewProps) {
  const { page, stats, mission, history, milestones, team, ethics, cta } = content;

  return (
    <>
      <PageHeader eyebrow={page.eyebrow} title={page.title} description={page.description} />

      <Container className="py-12 sm:py-16">
        <FadeIn>
          <section className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="شماره منتشرشده" value={stats.issueCount} />
            <StatCard label="سال فعالیت" value={stats.activeYears} suffix="سال" />
            <StatCard label="مخاطب فعال" value={stats.audienceCount} suffix="+" />
            <StatCard label="سال تأسیس" value={stats.foundedYear} />
          </section>
        </FadeIn>

        <section className="mb-16 grid gap-8 lg:grid-cols-2 lg:gap-10">
          <FadeIn>
            <article className="border-border from-accent/50 via-background to-muted/40 relative overflow-hidden rounded-3xl border bg-gradient-to-br p-7 sm:p-8">
              <SectionTitle title={mission.title} className="mb-5 sm:mb-5" />
              <p className="text-muted-foreground text-base leading-8 sm:text-[1.05rem]">
                {mission.body}
              </p>
            </article>
          </FadeIn>
          <FadeIn delay={0.08}>
            <article className="border-border bg-card relative overflow-hidden rounded-3xl border p-7 sm:p-8">
              <SectionTitle title={history.title} className="mb-5 sm:mb-5" />
              <p className="text-muted-foreground text-base leading-8 sm:text-[1.05rem]">
                {history.body}
              </p>
            </article>
          </FadeIn>
        </section>

        {milestones.length > 0 && (
          <section className="mb-16">
            <FadeIn>
              <SectionTitle
                eyebrow="مسیر رشد"
                title="نقاط عطف"
                subtitle="مراحل شکل‌گیری هویت تحریریه و جامعه مخاطبان"
              />
            </FadeIn>
            <ol className="relative grid gap-6 md:grid-cols-3">
              <div
                className="via-border pointer-events-none absolute inset-x-8 top-8 hidden h-px bg-gradient-to-l from-transparent to-transparent md:block"
                aria-hidden="true"
              />
              {milestones.map((item, index) => (
                <FadeIn key={item.id} delay={index * 0.06}>
                  <li className="border-border/80 bg-card/70 relative rounded-3xl border p-6">
                    <span className="bg-primary/10 text-primary inline-flex rounded-full px-3 py-1 text-sm font-semibold">
                      {item.year}
                    </span>
                    <h3 className="mt-4 text-lg font-bold tracking-tight">{item.title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </li>
                </FadeIn>
              ))}
            </ol>
          </section>
        )}

        <section className="mb-16">
          <FadeIn>
            <SectionTitle title={team.title} subtitle={team.subtitle} />
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {team.members.map((member, index) => (
              <FadeIn key={member.id} delay={index * 0.05}>
                <TeamCard member={member} />
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <FadeIn>
            <SectionTitle title={ethics.title} subtitle={ethics.subtitle} />
          </FadeIn>
          <div className="grid gap-4 md:grid-cols-2">
            {ethics.items.map((item, index) => (
              <FadeIn key={item.id} delay={index * 0.04}>
                <article className="border-border/80 bg-muted/20 flex gap-4 rounded-2xl border p-5">
                  <span
                    className="bg-primary text-primary-foreground mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-tight">{item.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </section>

        <FadeIn>
          <section className="border-border from-primary/10 via-background to-accent/40 relative overflow-hidden rounded-[2rem] border bg-gradient-to-br px-6 py-10 sm:px-10 sm:py-12">
            <div
              className="bg-primary/10 absolute -end-10 -top-10 size-40 rounded-full blur-3xl"
              aria-hidden="true"
            />
            <div className="relative max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{cta.title}</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">{cta.description}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={cta.primaryHref}>
                  <Button size="lg" className="rounded-full px-7">
                    {cta.primaryLabel}
                  </Button>
                </Link>
                <Link href={cta.secondaryHref}>
                  <Button size="lg" variant="outline" className="rounded-full px-7">
                    {cta.secondaryLabel}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </FadeIn>
      </Container>
    </>
  );
}
