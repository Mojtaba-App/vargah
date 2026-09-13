import type { AboutContent } from '@vargah/business/about-content';
import { Container } from '@vargah/ui/components/container';
import { Link } from '@/i18n/navigation';
import { Button } from '@vargah/ui/components/button';
import { StatCard } from '@/components/shared/stat-card';
import { SectionTitle } from '@/components/shared/section-title';
import { FadeIn } from '@/components/motion/fade-in';

type MagazineIntroSectionProps = {
  intro: AboutContent['intro'];
  stats: AboutContent['stats'];
};

export function MagazineIntroSection({ intro, stats }: MagazineIntroSectionProps) {
  return (
    <section className="section-padding relative overflow-hidden border-y border-border">
      <div
        className="absolute inset-0 bg-[linear-gradient(135deg,var(--accent)_0%,transparent_45%,var(--muted)_100%)] opacity-70"
        aria-hidden="true"
      />
      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <FadeIn>
            <SectionTitle
              eyebrow={intro.eyebrow}
              title={intro.title}
              subtitle={intro.subtitle}
              className="mb-0 sm:mb-0"
            />
            <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">{intro.body}</p>
            <Link href="/about" className="mt-8 inline-block">
              <Button variant="outline" size="lg" className="rounded-full px-7">
                {intro.ctaLabel}
              </Button>
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="شماره منتشرشده" value={stats.issueCount} />
              <StatCard label="سال فعالیت" value={stats.activeYears} suffix="سال" />
              <StatCard label="مخاطب فعال" value={stats.audienceCount} suffix="+" />
              <StatCard label="سال تأسیس" value={stats.foundedYear} />
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
