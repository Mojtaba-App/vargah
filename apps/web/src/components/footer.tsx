import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { Button } from '@vargah/ui/components/button';
import { Container } from '@vargah/ui/components/container';
import { HeaderLogo } from '@/components/layout/header-logo';
import { SocialLinks } from '@/components/shared/social-links';
import { cn } from '@/lib/utils';
import { getSiteConfig } from '@/lib/site-config';
import { getActiveSocialLinks } from '@vargah/business/site-settings';
import type { SocialLinksMap } from '@/components/shared/social-links';

const footerLinks = {
  magazine: [
    { href: '/about', label: 'درباره ما' },
    { href: '/issues', label: 'آرشیو شماره‌ها' },
    { href: '/articles', label: 'مقالات و اخبار' },
    { href: '/collaborate', label: 'همکاری با ما' },
  ],
  services: [
    { href: '/subscription', label: 'خرید اشتراک' },
    { href: '/advertising', label: 'تبلیغات و آگهی' },
    { href: '/contact', label: 'تماس با ما' },
  ],
  legal: [
    { href: '/legal/privacy', label: 'حریم خصوصی' },
    { href: '/legal/terms', label: 'قوانین استفاده' },
    { href: '/legal/submission-rules', label: 'قوانین ارسال' },
  ],
} as const;

function FooterNav({
  title,
  links,
  ariaLabel,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <nav aria-label={ariaLabel}>
      <h3 className="mb-4 text-sm font-bold text-foreground">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FooterCtaCard({
  title,
  description,
  href,
  cta,
  accent,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  accent: 'primary' | 'neutral';
}) {
  return (
    <Link
      href={href}
      className="group surface-card flex flex-col justify-between rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6"
    >
      <div>
        <p
          className={
            accent === 'primary'
              ? 'text-xs font-bold uppercase tracking-wider text-primary'
              : 'text-xs font-bold uppercase tracking-wider text-muted-foreground'
          }
        >
          {title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        {cta}
        <ArrowIcon className="transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export async function Footer() {
  const year = new Date().getFullYear();
  const [t, siteConfig] = await Promise.all([getTranslations('nav'), getSiteConfig()]);
  const socialLinks = getActiveSocialLinks(siteConfig.contact.social) as SocialLinksMap;

  return (
    <footer className="relative mt-auto border-t border-border bg-muted/20" role="contentinfo">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/40 to-transparent"
        aria-hidden="true"
      />

      <Container className="py-10 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <FooterCtaCard
            title="اشتراک دیجیتال"
            description="دسترسی کامل به آرشیو شماره‌ها و مطالب ویژه ماهنامه."
            href="/subscription"
            cta="مشاهده پلن‌ها"
            accent="primary"
          />
          <FooterCtaCard
            title="همکاری و ارسال مطلب"
            description="نویسندگان و عکاسان می‌توانند پیشنهاد خود را ارسال کنند."
            href="/collaborate"
            cta="شروع همکاری"
            accent="neutral"
          />
        </div>
      </Container>

      <div className="border-t border-border/70 bg-background/60">
        <Container className="py-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <HeaderLogo
                siteName={siteConfig.branding.siteName}
                tagline={siteConfig.branding.siteTagline}
                logoSrc={siteConfig.branding.siteLogo}
                homeAria={t('homeAria')}
              />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {siteConfig.footer.description}
              </p>
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold text-foreground">ما را دنبال کنید</p>
                <SocialLinks links={socialLinks} size="md" />
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3 lg:col-span-5">
              <FooterNav title="ماهنامه" links={footerLinks.magazine} ariaLabel="لینک‌های ماهنامه" />
              <FooterNav title="خدمات" links={footerLinks.services} ariaLabel="لینک‌های خدمات" />
              <FooterNav title="قوانین" links={footerLinks.legal} ariaLabel="لینک‌های قانونی" />
            </div>

            <aside className="lg:col-span-3">
              <div className="surface-card h-full rounded-2xl p-5 sm:p-6">
                <h3 className="text-sm font-bold text-foreground">ارتباط با تحریریه</h3>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>
                    <span className="mb-1 block text-xs font-medium text-foreground">ایمیل</span>
                    <a
                      href={`mailto:${siteConfig.footer.email}`}
                      className="transition-colors hover:text-primary"
                      dir="ltr"
                    >
                      {siteConfig.footer.email}
                    </a>
                  </li>
                  <li>
                    <span className="mb-1 block text-xs font-medium text-foreground">تلفن</span>
                    <a
                      href={`tel:${siteConfig.footer.phone.replace(/-/g, '')}`}
                      className="transition-colors hover:text-primary"
                      dir="ltr"
                    >
                      {siteConfig.footer.phone}
                    </a>
                  </li>
                  <li>
                    <span className="mb-1 block text-xs font-medium text-foreground">آدرس</span>
                    <p className="leading-relaxed">{siteConfig.footer.address}</p>
                  </li>
                </ul>
                <Link href="/contact" className="mt-5 block">
                  <Button variant="outline" className="h-10 w-full rounded-xl">
                    فرم تماس
                  </Button>
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </div>

      <div className="border-t border-border/70 bg-background">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} {siteConfig.footer.copyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-4', className)}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
