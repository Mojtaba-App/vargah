'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AuditAction, CommentStatus, prisma } from '@vargah/database';

import { recordAuditLog } from '@/lib/audit/record';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const commentIdSchema = z.object({
  id: z.string().cuid(),
});

async function moderateComment(id: string, status: CommentStatus) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.COMMENT_MODERATE);
  const { id: commentId } = commentIdSchema.parse({ id });

  const comment = await prisma.articleComment.update({
    where: { id: commentId },
    data: { status },
    select: { id: true, articleId: true },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'ArticleComment',
    entityId: comment.id,
    changes: { status },
  });

  revalidatePath('/content/comments');
  revalidatePath('/content/articles');
}

export async function approveComment(id: string) {
  await moderateComment(id, CommentStatus.APPROVED);
}

export async function rejectComment(id: string) {
  await moderateComment(id, CommentStatus.REJECTED);
}

export async function deleteComment(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.COMMENT_MODERATE);
  const { id: commentId } = commentIdSchema.parse({ id });

  await prisma.articleComment.delete({ where: { id: commentId } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'ArticleComment',
    entityId: commentId,
  });

  revalidatePath('/content/comments');
}
