'use server';

import { revalidatePath } from 'next/cache';
import { AuditAction, DiscountCodeScope, DiscountCodeType, prisma } from '@vargah/database';
import { normalizeDiscountCode } from '@vargah/business/discounts';
import { discountCodeAdminSchema } from '@vargah/security/schemas';

import { recordAuditLog } from '@/lib/audit/record';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { verifyCsrfFromRequest } from '@/lib/security/request';

function parseDiscountPayload(input: unknown) {
  return discountCodeAdminSchema.parse(input);
}

export async function createDiscountCode(input: unknown) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.DISCOUNT_MANAGE);
  const parsed = parseDiscountPayload(input);
  const code = normalizeDiscountCode(parsed.code);

  const existing = await prisma.discountCode.findUnique({ where: { code } });
  if (existing) throw new Error('این کد تخفیف قبلاً ثبت شده است.');

  const row = await prisma.discountCode.create({
    data: {
      code,
      title: parsed.title.trim(),
      description: parsed.description?.trim() || null,
      type: parsed.type as DiscountCodeType,
      value: parsed.value,
      scope: parsed.scope as DiscountCodeScope,
      planSlugs: parsed.scope === 'SELECTED' ? parsed.planSlugs : [],
      maxUses: parsed.maxUses ?? null,
      maxUsesPerUser: parsed.maxUsesPerUser ?? 1,
      minSubtotal: parsed.minSubtotal ?? null,
      startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
      endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
      isActive: parsed.isActive,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'discount_code',
    entityId: row.id,
    changes: { code: row.code, title: row.title },
  });

  revalidatePath('/discounts');
  return { id: row.id };
}

export async function updateDiscountCode(id: string, input: unknown) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.DISCOUNT_MANAGE);
  const parsed = parseDiscountPayload({ ...(input as object), id });
  const code = normalizeDiscountCode(parsed.code);

  const conflict = await prisma.discountCode.findFirst({
    where: { code, NOT: { id } },
  });
  if (conflict) throw new Error('این کد تخفیف قبلاً ثبت شده است.');

  const row = await prisma.discountCode.update({
    where: { id },
    data: {
      code,
      title: parsed.title.trim(),
      description: parsed.description?.trim() || null,
      type: parsed.type as DiscountCodeType,
      value: parsed.value,
      scope: parsed.scope as DiscountCodeScope,
      planSlugs: parsed.scope === 'SELECTED' ? parsed.planSlugs : [],
      maxUses: parsed.maxUses ?? null,
      maxUsesPerUser: parsed.maxUsesPerUser ?? 1,
      minSubtotal: parsed.minSubtotal ?? null,
      startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
      endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
      isActive: parsed.isActive,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'discount_code',
    entityId: row.id,
    changes: { code: row.code, title: row.title },
  });

  revalidatePath('/discounts');
  return { id: row.id };
}

export async function deleteDiscountCode(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.DISCOUNT_MANAGE);
  const row = await prisma.discountCode.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'discount_code',
    entityId: row.id,
    changes: { code: row.code },
  });

  revalidatePath('/discounts');
}

export async function toggleDiscountCodeActive(id: string, isActive: boolean) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.DISCOUNT_MANAGE);
  const row = await prisma.discountCode.update({
    where: { id },
    data: { isActive },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'discount_code',
    entityId: row.id,
    changes: { isActive },
  });

  revalidatePath('/discounts');
}
