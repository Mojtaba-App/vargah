'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@vargah/database';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { revokeRefreshTokenFamily } from '@/lib/security/refresh-token';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const revokeSessionSchema = z.object({
  sessionId: z.string().cuid(),
});

export async function revokeSession(sessionId: string) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SECURITY_MANAGE);
  const { sessionId: id } = revokeSessionSchema.parse({ sessionId });
  const session = await prisma.userSession.findUnique({ where: { id } });
  if (session) {
    await revokeRefreshTokenFamily(session.sessionToken);
    await prisma.userSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
  revalidatePath('/security');
}
