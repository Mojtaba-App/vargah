import { NotFoundView } from '@/components/errors/not-found-view';
import { getSiteConfig } from '@/lib/site-config';

export default async function NotFound() {
  let siteName = 'وارگه';
  let logoSrc = '/images/vargah-logo.svg';

  try {
    const config = await getSiteConfig();
    siteName = config.branding.siteName || siteName;
    logoSrc = config.branding.siteLogo || logoSrc;
  } catch {
    /* fallback branding */
  }

  return <NotFoundView siteName={siteName} logoSrc={logoSrc} />;
}
