import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@vargah/ui/components/button';
import { Container } from '@vargah/ui/components/container';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { FadeIn } from '@/components/motion/fade-in';
import { getSiteConfig } from '@/lib/site-config';

export async function HeroSection() {
  const [t, siteConfig] = await Promise.all([
    getTranslations('home'),
    getSiteConfig(),
  ]);

  return (
    <section className="content-under-header relative min-h-[min(68vh,620px)] overflow-hidden border-b border-border">
      <div className="absolute inset-0 z-0">
        <OptimizedImage
          src={siteConfig.branding.heroBanner}
          alt={t('heroImageAlt')}
          fill
          priority
          unoptimized
          sizes="100vw"
          wrapperClassName="size-full"
          className="object-cover object-center scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-l from-primary/10 via-transparent to-transparent"
          aria-hidden="true"
        />
      </div>

      <Container className="relative z-[2] flex min-h-[min(68vh,620px)] items-center pb-10 pt-[calc(var(--site-header-height)+1.5rem)] sm:pb-14 sm:pt-[calc(var(--site-header-height)+2rem)]">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <FadeIn className="max-w-2xl">
            <p className="section-eyebrow mb-4">{t('badge')}</p>
            <h1 className="text-balance text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t('subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/issues">
                <Button size="lg" className="rounded-full px-8 shadow-md">
                  {t('ctaPrimary')}
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="rounded-full bg-background/70 px-8 backdrop-blur-sm">
                  {t('ctaSecondary')}
                </Button>
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.12} className="hidden lg:block">
            <div className="surface-card rounded-3xl p-6 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">ویژگی‌ها</p>
              <ul className="mt-4 space-y-4">
                {(['content', 'archive', 'community'] as const).map((key) => (
                  <li key={key} className="border-b border-border/70 pb-4 last:border-0 last:pb-0">
                    <p className="font-semibold text-foreground">{t(`features.${key}.title`)}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t(`features.${key}.description`)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
