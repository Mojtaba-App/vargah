import { prisma } from '@vargah/database';
import {
  DEFAULT_SITE_CONFIG,
  SITE_CONFIG_KEY,
  mergeSiteConfig,
  type SiteConfig,
} from '@vargah/business/site-settings';
import { unstable_cache } from 'next/cache';

async function loadSiteConfig(): Promise<SiteConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SITE_CONFIG_KEY } });
    if (!row?.value) return DEFAULT_SITE_CONFIG;
    return mergeSiteConfig(row.value);
  } catch (error) {
    console.error('[site-config] Falling back to defaults:', error);
    return DEFAULT_SITE_CONFIG;
  }
}

export const getSiteConfig = unstable_cache(loadSiteConfig, ['site-config'], {
  revalidate: 60,
  tags: ['site-config'],
});
