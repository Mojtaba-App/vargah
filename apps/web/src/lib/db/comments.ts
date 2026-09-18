import { cache } from 'react';
import { prisma, CommentStatus } from '@vargah/database';

export type PublicComment = {
  id: string;
  articleId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export const getCachedApprovedComments = cache(
  async (articleId: string): Promise<PublicComment[]> => {
    if (!process.env.DATABASE_URL) return [];

    try {
      const rows = await prisma.articleComment.findMany({
        where: { articleId, status: CommentStatus.APPROVED },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          articleId: true,
          authorName: true,
          content: true,
          createdAt: true,
        },
      });

      return rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  },
);
