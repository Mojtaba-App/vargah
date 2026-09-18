import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@vargah/ui/components/button';
import { Container } from '@vargah/ui/components/container';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { FadeIn } from '@/components/motion/fade-in';
import { getSiteConfig } from '@/lib/site-config';

export async function HeroSection() {
  const [t, siteConfig] = await Promise.all([getTranslations('home'), getSiteConfig()]);

  return (
    <section className="content-under-header border-border relative min-h-[min(68vh,620px)] overflow-hidden border-b">
      <div className="absolute inset-0 z-0">
        <OptimizedImage
          src={siteConfig.branding.heroBanner}
          alt={t('heroImageAlt')}
          fill
          priority
          unoptimized
          sizes="100vw"
          wrapperClassName="size-full"
          className="scale-105 object-cover object-center"
        />
        <div
          className="from-background via-background/75 absolute inset-0 bg-gradient-to-t to-transparent"
          aria-hidden="true"
        />
        <div
          className="from-primary/10 absolute inset-0 bg-gradient-to-l via-transparent to-transparent"
          aria-hidden="true"
        />
      </div>

      <Container className="relative z-[2] flex min-h-[min(68vh,620px)] items-center pt-[calc(var(--site-header-height)+1.5rem)] pb-10 sm:pt-[calc(var(--site-header-height)+2rem)] sm:pb-14">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <FadeIn className="max-w-2xl">
            <p className="section-eyebrow mb-4">{t('badge')}</p>
            <h1 className="text-4xl leading-[1.15] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-base leading-relaxed sm:text-lg">
              {t('subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/issues">
                <Button size="lg" className="rounded-full px-8 shadow-md">
                  {t('ctaPrimary')}
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-background/70 rounded-full px-8 backdrop-blur-sm"
                >
                  {t('ctaSecondary')}
                </Button>
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.12} className="hidden lg:block">
            <div className="surface-card rounded-3xl p-6 backdrop-blur-md">
              <p className="text-primary text-xs font-semibold tracking-wider uppercase">
                ویژگی‌ها
              </p>
              <ul className="mt-4 space-y-4">
                {(['content', 'archive', 'community'] as const).map((key) => (
                  <li key={key} className="border-border/70 border-b pb-4 last:border-0 last:pb-0">
                    <p className="text-foreground font-semibold">{t(`features.${key}.title`)}</p>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
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
