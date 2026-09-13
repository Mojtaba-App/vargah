import { prisma } from '@vargah/database';
import {
  DEFAULT_SITE_CONFIG,
  SITE_CONFIG_KEY,
  mergeSiteConfig,
  type SiteConfig,
} from '@vargah/business/site-settings';

export async function getSiteConfig(): Promise<SiteConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SITE_CONFIG_KEY } });
  if (!row?.value) return DEFAULT_SITE_CONFIG;
  return mergeSiteConfig(row.value);
}

export async function saveSiteConfig(config: SiteConfig) {
  await prisma.siteSetting.upsert({
    where: { key: SITE_CONFIG_KEY },
    create: { key: SITE_CONFIG_KEY, value: config },
    update: { value: config },
  });
}
