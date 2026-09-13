import { getSiteUrl } from '@vargah/seo/site';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/admin/',
        '/profile',
        '/fa/profile',
        '/subscription?*',
        '/login',
        '/fa/login',
        '/en',
        '/en/',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
