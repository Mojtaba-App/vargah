import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/layout/site-header';
import { getSiteConfig } from '@/lib/site-config';
import { getPublicServicesContent } from '@/lib/services-content';

export async function Header({ locale }: { locale: string }) {
  const [t, siteConfig, services] = await Promise.all([
    getTranslations({ locale, namespace: 'nav' }),
    getSiteConfig(),
    getPublicServicesContent(),
  ]);

  const primaryLinks = [
    { href: '/issues', label: t('issues') },
    { href: '/articles', label: t('articles') },
    { href: '/about', label: t('about') },
  ];

  return (
    <SiteHeader
      primaryLinks={primaryLinks}
      serviceNavItems={services.nav}
      labels={{
        homeAria: t('homeAria'),
        tagline: siteConfig.branding.siteTagline,
        services: t('services'),
        search: t('search'),
        searchPlaceholder: t('searchPlaceholder'),
        cart: t('cart'),
        subscribe: t('subscribe'),
      }}
      branding={{
        siteName: siteConfig.branding.siteName,
        tagline: siteConfig.branding.siteTagline,
        logoSrc: siteConfig.branding.siteLogo,
      }}
    />
  );
}
