import { prisma } from '@vargah/database';
import {
  ABOUT_CONTENT_KEY,
  DEFAULT_ABOUT_CONTENT,
  getActiveTeamMembers,
  mergeAboutContent,
  type AboutContent,
} from '@vargah/business/about-content';

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: ABOUT_CONTENT_KEY } });
    if (!row?.value) return DEFAULT_ABOUT_CONTENT;
    return mergeAboutContent(row.value);
  } catch (error) {
    console.error('[about-content] fallback:', error);
    return DEFAULT_ABOUT_CONTENT;
  }
}

export async function getPublicAboutContent() {
  const content = await getAboutContent();
  return {
    ...content,
    team: {
      ...content.team,
      members: getActiveTeamMembers(content.team.members),
    },
  };
}

export type PublicAboutContent = Awaited<ReturnType<typeof getPublicAboutContent>>;
