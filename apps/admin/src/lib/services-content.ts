import { prisma } from '@vargah/database';
import {
  DEFAULT_SERVICES_CONTENT,
  SERVICES_CONTENT_KEY,
  mergeServicesContent,
  type ServicesContent,
} from '@vargah/business/services-content';

export async function getServicesContent(): Promise<ServicesContent> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SERVICES_CONTENT_KEY } });
  if (!row?.value) return DEFAULT_SERVICES_CONTENT;
  return mergeServicesContent(row.value);
}

export async function saveServicesContent(content: ServicesContent) {
  await prisma.siteSetting.upsert({
    where: { key: SERVICES_CONTENT_KEY },
    create: { key: SERVICES_CONTENT_KEY, value: content },
    update: { value: content },
  });
}
