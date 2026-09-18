'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  AuditAction,
  CommissionStatus as PrismaCommissionStatus,
  ContributorType as PrismaContributorType,
  TaskStatus as PrismaTaskStatus,
  prisma,
} from '@vargah/database';

import { recordAuditLog } from '@/lib/audit/record';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import { CommissionStatus, ContributorType, TaskStatus } from '@/lib/contributors/constants';

const REVALIDATE_PATHS = [
  '/contributors',
  '/contributors/workflow',
  '/contributors/tasks',
  '/contributors/calendar',
];

function revalidateContributors() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

const createContributorSchema = z.object({
  userId: z.string().cuid(),
  type: z.enum(['WRITER', 'JOURNALIST', 'DESIGNER', 'PHOTOGRAPHER']),
  bio: z.string().trim().max(5000).optional(),
  feePerWord: z.number().nonnegative().max(1_000_000).optional(),
  bankInfo: z.string().trim().max(2000).optional(),
});

const updateContributorSchema = z.object({
  type: z.enum(['WRITER', 'JOURNALIST', 'DESIGNER', 'PHOTOGRAPHER']).optional(),
  bio: z.string().trim().max(5000).optional(),
  feePerWord: z.number().nonnegative().max(1_000_000).nullable().optional(),
  bankInfo: z.string().trim().max(2000).nullable().optional(),
});

export async function createContributor(data: {
  userId: string;
  type: ContributorType;
  bio?: string;
  feePerWord?: number;
  bankInfo?: string;
}) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);
  const parsed = createContributorSchema.parse(data);

  const existing = await prisma.contributor.findUnique({ where: { userId: parsed.userId } });
  if (existing) throw new Error('این کاربر قبلاً پروفایل همکار دارد');

  const contributor = await prisma.contributor.create({
    data: {
      userId: parsed.userId,
      type: parsed.type as PrismaContributorType,
      bio: parsed.bio?.trim() || undefined,
      feePerWord: parsed.feePerWord,
      bankInfo: parsed.bankInfo?.trim() || undefined,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'Contributor',
    entityId: contributor.id,
  });

  revalidateContributors();
  return contributor.id;
}

export async function updateContributor(
  id: string,
  data: {
    type?: ContributorType;
    bio?: string;
    feePerWord?: number | null;
    bankInfo?: string | null;
  },
) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);
  const parsedId = z.string().cuid().parse(id);
  const parsed = updateContributorSchema.parse(data);

  await prisma.contributor.update({
    where: { id: parsedId },
    data: {
      type: parsed.type ? (parsed.type as PrismaContributorType) : undefined,
      bio: parsed.bio !== undefined ? parsed.bio?.trim() || null : undefined,
      feePerWord: parsed.feePerWord !== undefined ? parsed.feePerWord : undefined,
      bankInfo: parsed.bankInfo !== undefined ? parsed.bankInfo?.trim() || null : undefined,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Contributor',
    entityId: parsedId,
  });

  revalidateContributors();
}

export async function createTask(data: {
  contributorId: string;
  title: string;
  description?: string;
  issueId?: string;
  assignedToId: string;
  dueDate?: string;
}) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);

  if (!data.title.trim()) throw new Error('عنوان وظیفه الزامی است');

  const task = await prisma.contributorTask.create({
    data: {
      contributorId: data.contributorId,
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      issueId: data.issueId || undefined,
      assignedToId: data.assignedToId,
      createdById: session.user.id,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: PrismaTaskStatus.TODO,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'ContributorTask',
    entityId: task.id,
  });

  revalidateContributors();
  return task.id;
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);

  await prisma.contributorTask.update({
    where: { id },
    data: { status: status as PrismaTaskStatus },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'ContributorTask',
    entityId: id,
    changes: { status },
  });

  revalidateContributors();
}

export async function deleteTask(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);

  await prisma.contributorTask.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'ContributorTask',
    entityId: id,
  });

  revalidateContributors();
}

export async function createCalendarItem(data: {
  title: string;
  description?: string;
  dueDate: string;
  userId: string;
  issueId?: string;
}) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);

  if (!data.title.trim()) throw new Error('عنوان الزامی است');
  if (!data.dueDate) throw new Error('مهلت تحویل الزامی است');

  const item = await prisma.editorialCalendar.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      dueDate: new Date(data.dueDate),
      userId: data.userId,
      issueId: data.issueId || undefined,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'EditorialCalendar',
    entityId: item.id,
  });

  revalidateContributors();
  return item.id;
}

export async function updateCalendarItem(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    dueDate?: string;
    userId?: string;
    issueId?: string | null;
  },
) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);

  await prisma.editorialCalendar.update({
    where: { id },
    data: {
      title: data.title?.trim(),
      description: data.description !== undefined ? data.description?.trim() || null : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      userId: data.userId,
      issueId: data.issueId !== undefined ? data.issueId || null : undefined,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'EditorialCalendar',
    entityId: id,
  });

  revalidateContributors();
}

export async function deleteCalendarItem(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);

  await prisma.editorialCalendar.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'EditorialCalendar',
    entityId: id,
  });

  revalidateContributors();
}

export async function assignCommissionWriterAction(
  id: string,
  assigneeId: string,
  contributorId: string,
  dueDate?: string,
) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);

  await prisma.articleCommission.update({
    where: { id },
    data: {
      assigneeId,
      contributorId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: PrismaCommissionStatus.ASSIGNED,
      deadlineNotifiedAt: null,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'ArticleCommission',
    entityId: id,
  });

  revalidateContributors();
  revalidatePath(`/contributors/workflow/${id}`);
}
