'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AuditAction, CommissionStatus, prisma } from '@vargah/database';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { canTransition } from '@/lib/communications/workflow';
import { fireWebhooks } from '@/lib/communications/dispatcher';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const createCommissionSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  assigneeId: z.string().cuid().optional(),
  contributorId: z.string().cuid().optional(),
  issueId: z.string().cuid().optional(),
  dueDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .optional(),
});

const transitionSchema = z.object({
  id: z.string().cuid(),
  toStatus: z.nativeEnum(CommissionStatus),
  reviewNote: z.string().trim().max(2000).optional(),
});

export async function createCommission(data: {
  title: string;
  description?: string;
  assigneeId?: string;
  contributorId?: string;
  issueId?: string;
  dueDate?: string;
}) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.COMMISSION_MANAGE);
  const parsed = createCommissionSchema.parse(data);

  const status = parsed.assigneeId ? CommissionStatus.ASSIGNED : CommissionStatus.TOPIC_DEFINED;

  const commission = await prisma.articleCommission.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      createdById: session.user.id,
      assigneeId: parsed.assigneeId,
      contributorId: parsed.contributorId,
      issueId: parsed.issueId,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
      status,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'ArticleCommission',
    entityId: commission.id,
  });

  if (parsed.assigneeId) {
    await fireWebhooks('commission.assigned', {
      title: 'سفارش مطلب جدید',
      message: `«${parsed.title}» به نویسنده تخصیص یافت`,
      metadata: { commissionId: commission.id },
    });
  }

  revalidatePath('/contributors');
  revalidatePath('/contributors/workflow');
  revalidatePath('/contributors/tasks');
  revalidatePath('/contributors/calendar');
  return commission.id;
}

export async function transitionCommission(
  id: string,
  toStatus: CommissionStatus,
  reviewNote?: string,
) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.COMMISSION_MANAGE);
  const parsed = transitionSchema.parse({ id, toStatus, reviewNote });

  const commission = await prisma.articleCommission.findUniqueOrThrow({ where: { id: parsed.id } });

  if (!canTransition(commission.status, parsed.toStatus)) {
    throw new Error(`انتقال از ${commission.status} به ${parsed.toStatus} مجاز نیست`);
  }

  await prisma.articleCommission.update({
    where: { id: parsed.id },
    data: {
      status: parsed.toStatus,
      reviewNote: parsed.reviewNote ?? commission.reviewNote,
      deadlineNotifiedAt:
        parsed.toStatus === CommissionStatus.IN_WRITING ? null : commission.deadlineNotifiedAt,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action:
      parsed.toStatus === CommissionStatus.APPROVED ? AuditAction.APPROVE : AuditAction.UPDATE,
    entity: 'ArticleCommission',
    entityId: parsed.id,
    changes: { status: parsed.toStatus },
  });

  if (
    parsed.toStatus === CommissionStatus.APPROVED ||
    parsed.toStatus === CommissionStatus.REJECTED
  ) {
    await fireWebhooks('commission.reviewed', {
      title: parsed.toStatus === CommissionStatus.APPROVED ? 'مطلب تأیید شد' : 'مطلب رد شد',
      message: `«${commission.title}» — ${parsed.toStatus}`,
      metadata: { commissionId: parsed.id, status: parsed.toStatus },
    });
  }

  revalidatePath('/contributors');
  revalidatePath('/contributors/workflow');
  revalidatePath('/contributors/tasks');
  revalidatePath('/contributors/calendar');
  revalidatePath(`/contributors/workflow/${id}`);
}

export async function rateContributor(data: {
  contributorId: string;
  commissionId?: string;
  score: number;
  note?: string;
}) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.COMMISSION_MANAGE);

  if (data.score < 1 || data.score > 5) throw new Error('امتیاز باید بین ۱ تا ۵ باشد');

  await prisma.contributorRating.create({
    data: {
      contributorId: data.contributorId,
      commissionId: data.commissionId,
      score: data.score,
      note: data.note,
      ratedById: session.user.id,
    },
  });

  revalidatePath('/contributors');
  revalidatePath(`/contributors/workflow/${data.commissionId ?? ''}`);
}

export async function assignCommissionWriter(
  id: string,
  assigneeId: string,
  contributorId: string,
  dueDate?: string,
) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.COMMISSION_MANAGE);

  await prisma.articleCommission.update({
    where: { id },
    data: {
      assigneeId,
      contributorId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: CommissionStatus.ASSIGNED,
      deadlineNotifiedAt: null,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'ArticleCommission',
    entityId: id,
  });

  revalidatePath('/contributors');
  revalidatePath('/contributors/workflow');
  revalidatePath('/contributors/tasks');
  revalidatePath('/contributors/calendar');
  revalidatePath(`/contributors/workflow/${id}`);
}
