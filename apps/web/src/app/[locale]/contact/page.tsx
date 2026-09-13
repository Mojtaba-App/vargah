import { setRequestLocale } from 'next-intl/server';

import { ContactPageView } from '@/components/contact/contact-page-view';
import { getSiteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const siteConfig = await getSiteConfig();

  return <ContactPageView contact={siteConfig.contact} />;
}
