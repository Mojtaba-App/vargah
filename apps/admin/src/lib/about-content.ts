import { prisma } from '@vargah/database';
import {
  ABOUT_CONTENT_KEY,
  DEFAULT_ABOUT_CONTENT,
  mergeAboutContent,
  type AboutContent,
} from '@vargah/business/about-content';

export async function getAboutContent(): Promise<AboutContent> {
  const row = await prisma.siteSetting.findUnique({ where: { key: ABOUT_CONTENT_KEY } });
  if (!row?.value) return DEFAULT_ABOUT_CONTENT;
  return mergeAboutContent(row.value);
}

export async function saveAboutContent(content: AboutContent) {
  await prisma.siteSetting.upsert({
    where: { key: ABOUT_CONTENT_KEY },
    create: { key: ABOUT_CONTENT_KEY, value: content },
    update: { value: content },
  });
}
