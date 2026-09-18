'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { revalidatePath } from 'next/cache';
import { prisma, AuditAction } from '@vargah/database';
import { z } from 'zod';

import { requireAuth } from '@/lib/auth-utils';
import { setSessionCookie } from '@/lib/session-token';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'نام باید حداقل ۲ کاراکتر باشد').max(80),
});

export async function updateProfile(formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();
  const parsed = profileSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'اطلاعات نامعتبر است' };
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });

  await recordAuditLog({
    userId: user.id,
    action: AuditAction.UPDATE,
    entity: 'User',
    entityId: user.id,
    changes: { field: 'profile' },
  });

  await setSessionCookie(user);
  revalidatePath('/', 'layout');
  revalidatePath('/profile');

  return { success: true as const };
}

export async function removeProfileAvatar() {
  await verifyCsrfFromRequest();
  const session = await requireAuth();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar: null },
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });

  await setSessionCookie(user);
  revalidatePath('/', 'layout');
  revalidatePath('/profile');

  return { success: true as const };
}
