import { prisma } from '@vargah/database';
import {
  DEFAULT_SERVICES_CONTENT,
  SERVICES_CONTENT_KEY,
  getActiveAdPricing,
  getActiveAdPlacements,
  getActiveCollaborationTypes,
  getActiveJobs,
  getActivePortfolio,
  mergeServicesContent,
  type ServicesContent,
} from '@vargah/business/services-content';

export async function getServicesContent(): Promise<ServicesContent> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SERVICES_CONTENT_KEY } });
    if (!row?.value) return DEFAULT_SERVICES_CONTENT;
    return mergeServicesContent(row.value);
  } catch (error) {
    console.error('[services-content] fallback:', error);
    return DEFAULT_SERVICES_CONTENT;
  }
}

export async function getPublicServicesContent() {
  const content = await getServicesContent();
  return {
    ...content,
    advertising: {
      ...content.advertising,
      pricing: getActiveAdPricing(content.advertising.pricing),
      placements: getActiveAdPlacements(content.advertising.placements),
      portfolio: getActivePortfolio(content.advertising.portfolio),
    },
    collaborate: {
      ...content.collaborate,
      jobs: getActiveJobs(content.collaborate.jobs),
      collaborationTypes: getActiveCollaborationTypes(content.collaborate.collaborationTypes),
    },
  };
}

export type PublicServicesContent = Awaited<ReturnType<typeof getPublicServicesContent>>;
