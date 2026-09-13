'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AuditAction, PaymentStatus as PrismaPaymentStatus, prisma } from '@vargah/database';

import { recordAuditLog } from '@/lib/audit/record';
import { requirePermission } from '@/lib/auth-utils';
import { PaymentStatus, type PaymentStatus as PaymentStatusType } from '@/lib/finance/constants';
import { PERMISSIONS } from '@/lib/permissions';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const updatePaymentStatusSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
});

export async function updatePaymentStatus(id: string, status: PaymentStatusType) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.FINANCE_MANAGE);
  const parsed = updatePaymentStatusSchema.parse({ id, status });

  const data: { status: PrismaPaymentStatus; paidAt?: Date | null } = {
    status: parsed.status as PrismaPaymentStatus,
  };

  if (parsed.status === PaymentStatus.PAID) {
    data.paidAt = new Date();
  }

  await prisma.payment.update({ where: { id: parsed.id }, data });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Payment',
    entityId: parsed.id,
    changes: { status: parsed.status },
  });

  revalidatePath('/finance');
  revalidatePath('/');
}
