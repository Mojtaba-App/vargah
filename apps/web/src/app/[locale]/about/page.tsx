import { setRequestLocale } from 'next-intl/server';

import { AboutPageView } from '@/components/about/about-page-view';
import { getPublicAboutContent } from '@/lib/about-content';

export const dynamic = 'force-dynamic';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const content = await getPublicAboutContent();

  return <AboutPageView content={content} />;
}
