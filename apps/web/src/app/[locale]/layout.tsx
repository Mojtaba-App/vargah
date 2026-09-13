import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { CustomerAuthProvider } from '@/components/auth/customer-auth-provider';
import { DirectionSync } from '@/components/layout/direction-sync';
import { SkipLink } from '@/components/layout/skip-link';
import { SubscriptionCartDrawer } from '@/components/subscription/subscription-cart-drawer';
import { SubscriptionCartProvider } from '@/components/subscription/subscription-cart-provider';
import { LiveChatWidget } from '@/components/chat/live-chat-widget';
import { CsrfFetchInit } from '@/components/security/csrf-fetch-init';
import { CookieConsentBanner } from '@/components/privacy/cookie-consent-banner';
import { routing, type Locale } from '@/i18n/routing';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { JsonLd } from '@/components/seo/json-ld';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@vargah/seo/json-ld';
import { getSiteUrl } from '@vargah/seo/site';
import { getSiteConfig } from '@/lib/site-config';
import { getCustomerSession } from '@/lib/customer-auth/session';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2efe6' },
    { media: '(prefers-color-scheme: dark)', color: '#101614' },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [t, siteConfig] = await Promise.all([
    getTranslations({ locale, namespace: 'metadata' }),
    getSiteConfig(),
  ]);

  return {
    title: {
      default: siteConfig.branding.siteName,
      template: `%s | ${siteConfig.branding.siteName}`,
    },
    description: t('description'),
    icons: {
      icon: siteConfig.branding.favicon,
    },
    metadataBase: new URL(getSiteUrl()),
    verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const [initialCustomer, hdrs] = await Promise.all([getCustomerSession(), headers()]);
  const nonce = hdrs.get('x-nonce') ?? undefined;

  return (
    <NextIntlClientProvider messages={messages}>
      <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
      <AnalyticsProvider nonce={nonce} />
      <CsrfFetchInit />
      <DirectionSync />
      <SkipLink />
      <CustomerAuthProvider initialCustomer={initialCustomer}>
        <SubscriptionCartProvider>
          <div className="flex min-h-screen flex-col">
            <Header locale={locale} />
            <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
              {children}
            </main>
            <Footer />
          </div>
          <SubscriptionCartDrawer />
          <LiveChatWidget />
          <CookieConsentBanner />
        </SubscriptionCartProvider>
      </CustomerAuthProvider>
    </NextIntlClientProvider>
  );
}
