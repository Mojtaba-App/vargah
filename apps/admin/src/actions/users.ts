'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma, UserRole, UserStatus, AuditAction } from '@vargah/database';
import { ZodError } from 'zod';
import {
  adminUserCreateSchema,
  adminUserPasswordSchema,
  adminUserUpdateSchema,
  rolePermissionsUpdateSchema,
} from '@vargah/security/schemas/admin-user';
import { hashPassword } from '@vargah/security/password';
import { normalizeIranPhone } from '@vargah/security/phone';

import { requireAuth, requirePermission } from '@/lib/auth-utils';
import {
  PERMISSIONS,
  ADMIN_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_LABELS,
  isFullAccessRole,
  type Permission,
} from '@/lib/permissions';
import {
  getRolePermissionsMap,
  hasAnyPermissionAsync,
  hasPermissionAsync,
  seedDefaultRolePermissionsIfEmpty,
} from '@/lib/permissions-server';
import {
  canActorChangeRole,
  canActorDeleteTarget,
  canActorManageTarget,
  canAssignRole,
} from '@/lib/users/policy';
import { verifyCsrfFromRequest } from '@/lib/security/request';

async function assertUserCreateAccess(actorRole: UserRole, targetRole: UserRole) {
  const canManage = await hasPermissionAsync(actorRole, PERMISSIONS.USER_MANAGE);
  const canCreate = await hasPermissionAsync(actorRole, PERMISSIONS.USER_CREATE);
  if (!canManage && !canCreate) {
    throw new Error('دسترسی ایجاد کاربر ندارید');
  }
  if (!canAssignRole(actorRole, targetRole)) {
    throw new Error('اجازه اختصاص این نقش را ندارید');
  }
}

async function assertUserEditAccess(
  actorRole: UserRole,
  actorId: string,
  target: { id: string; role: UserRole },
  nextRole?: UserRole,
) {
  const canManage = await hasPermissionAsync(actorRole, PERMISSIONS.USER_MANAGE);
  const canEdit = await hasPermissionAsync(actorRole, PERMISSIONS.USER_EDIT);
  if (!canManage && !canEdit) {
    throw new Error('دسترسی ویرایش کاربر ندارید');
  }
  if (!canActorManageTarget(actorRole, target.role, actorId, target.id)) {
    throw new Error('اجازه مدیریت این کاربر را ندارید');
  }
  if (nextRole && !canActorChangeRole(actorRole, target.role, nextRole)) {
    throw new Error('اجازه تغییر به این نقش را ندارید');
  }
}

function parseCreateUserForm(formData: FormData) {
  return adminUserCreateSchema.parse({
    name: formData.get('name'),
    email: formData.get('email') || null,
    username: formData.get('username') || null,
    phone: formData.get('phone') || null,
    role: formData.get('role'),
    status: formData.get('status') || 'ACTIVE',
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
  });
}

function formField(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function throwValidationError(error: unknown): never {
  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join(' · ');
    throw new Error(message || 'اطلاعات فرم نامعتبر است');
  }
  throw error;
}

function parseUpdateUserForm(
  formData: FormData,
  existing: { email: string | null; username: string | null; role: UserRole; status: UserStatus },
) {
  try {
    return adminUserUpdateSchema.parse({
      name: formData.get('name'),
      email: formField(formData.get('email')),
      username: formField(formData.get('username')),
      phone: formData.get('phone') ?? '',
      role: formField(formData.get('role')) ?? existing.role,
      status: formField(formData.get('status')) ?? existing.status,
    });
  } catch (error) {
    throwValidationError(error);
  }
}

export async function createAdminUser(formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();
  const parsed = parseCreateUserForm(formData);

  await assertUserCreateAccess(session.user.role, parsed.role as UserRole);

  const existingEmail = parsed.email
    ? await prisma.user.findUnique({ where: { email: parsed.email } })
    : null;
  if (existingEmail) throw new Error('این ایمیل قبلاً ثبت شده است');

  if (parsed.username) {
    const existingUsername = await prisma.user.findUnique({ where: { username: parsed.username } });
    if (existingUsername) throw new Error('این نام کاربری قبلاً ثبت شده است');
  }

  const normalizedPhone = normalizeIranPhone(parsed.phone);
  const phoneOwner = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (phoneOwner) throw new Error('این شماره موبایل قبلاً ثبت شده است');

  const passwordHash = await hashPassword(parsed.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      username: parsed.username,
      phone: normalizedPhone,
      passwordHash,
      role: parsed.role as UserRole,
      status: parsed.status as UserStatus,
    },
  });

  await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE,
      entity: 'User',
      entityId: user.id,
      changes: { email: user.email, role: user.role },
    });

  revalidatePath('/users');
  redirect(`/users/${user.id}`);
}

export async function updateAdminUser(userId: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || !ADMIN_ROLES.includes(existing.role)) {
    throw new Error('کاربر یافت نشد');
  }

  const parsed = parseUpdateUserForm(formData, existing);

  await assertUserEditAccess(session.user.role, session.user.id, existing, parsed.role as UserRole);

  if (parsed.email && parsed.email !== existing.email) {
    const emailOwner = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (emailOwner && emailOwner.id !== userId) throw new Error('این ایمیل قبلاً ثبت شده است');
  }

  if (parsed.username && parsed.username !== existing.username) {
    const usernameOwner = await prisma.user.findUnique({ where: { username: parsed.username } });
    if (usernameOwner && usernameOwner.id !== userId) throw new Error('این نام کاربری قبلاً ثبت شده است');
  }

  if (parsed.phone && parsed.phone !== existing.phone) {
    const normalizedPhone = normalizeIranPhone(parsed.phone);
    parsed.phone = normalizedPhone;
    const phoneOwner = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (phoneOwner && phoneOwner.id !== userId) throw new Error('این شماره موبایل قبلاً ثبت شده است');
  }

  if (session.user.id === userId && parsed.status !== UserStatus.ACTIVE) {
    throw new Error('نمی‌توانید حساب خود را غیرفعال کنید');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.name,
      email: parsed.email,
      username: parsed.username,
      phone: parsed.phone,
      role: parsed.role as UserRole,
      status: parsed.status as UserStatus,
    },
  });

  await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: userId,
      changes: { role: parsed.role, status: parsed.status },
    });

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

export async function updateAdminUserPassword(userId: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();

  const parsed = adminUserPasswordSchema.parse({
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
  });

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || !ADMIN_ROLES.includes(existing.role)) {
    throw new Error('کاربر یافت نشد');
  }

  const canManage = await hasAnyPermissionAsync(session.user.role, [
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.USER_EDIT,
  ]);
  if (!canManage) throw new Error('دسترسی تغییر رمز ندارید');

  if (
    session.user.id !== userId &&
    !canActorManageTarget(session.user.role, existing.role, session.user.id, userId)
  ) {
    throw new Error('اجازه تغییر رمز این کاربر را ندارید');
  }

  const passwordHash = await hashPassword(parsed.password);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: userId,
      changes: { field: 'password' },
    });

  revalidatePath(`/users/${userId}`);
}

export async function deleteAdminUser(userId: string, reason?: string) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();

  if (!(await hasPermissionAsync(session.user.role, PERMISSIONS.USER_MANAGE))) {
    throw new Error('فقط مدیر کل می‌تواند کاربر را حذف کند');
  }

  const reasonText = String(reason ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 500);
  if (reasonText.length < 3) {
    throw new Error('دلیل حذف الزامی است (حداقل ۳ کاراکتر)');
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || !ADMIN_ROLES.includes(existing.role)) {
    throw new Error('کاربر یافت نشد');
  }

  if (
    !canActorDeleteTarget(session.user.role, existing.role, session.user.id, userId)
  ) {
    throw new Error('حذف این کاربر مجاز نیست');
  }

  const actorId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      // وابستگی‌های اجباری را به مدیر حذف‌کننده منتقل کن تا FK مانع حذف نشود
      await tx.article.updateMany({
        where: { authorId: userId },
        data: { authorId: actorId },
      });
      await tx.articleVersion.updateMany({
        where: { createdBy: userId },
        data: { createdBy: actorId },
      });
      await tx.contributorTask.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: actorId },
      });
      await tx.contributorTask.updateMany({
        where: { createdById: userId },
        data: { createdById: actorId },
      });
      await tx.editorialCalendar.updateMany({
        where: { userId },
        data: { userId: actorId },
      });
      await tx.articleCommission.updateMany({
        where: { createdById: userId },
        data: { createdById: actorId },
      });
      await tx.contributorRating.updateMany({
        where: { ratedById: userId },
        data: { ratedById: actorId },
      });

      // ارجاعات اختیاری بدون Cascade
      await tx.message.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null },
      });
      await tx.ticket.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null },
      });
      await tx.articleCommission.updateMany({
        where: { assigneeId: userId },
        data: { assigneeId: null },
      });

      await tx.user.delete({ where: { id: userId } });
    });
  } catch (error) {
    console.error('[deleteAdminUser]', error);
    throw new Error(
      'حذف کاربر ممکن نشد. وابستگی‌های داده مانع حذف است. لطفاً دوباره تلاش کنید یا پشتیبانی را مطلع کنید.',
    );
  }

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'User',
    entityId: userId,
    changes: {
      email: existing.email,
      username: existing.username,
      name: existing.name,
      role: existing.role,
      reason: reasonText,
    },
  });

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  return { ok: true as const };
}

export async function updateRolePermissions(role: UserRole, permissions: Permission[]) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();

  if (!(await hasPermissionAsync(session.user.role, PERMISSIONS.ROLE_PERMISSION_MANAGE))) {
    throw new Error('دسترسی ویرایش ماتریس نقش‌ها را ندارید');
  }

  const parsed = rolePermissionsUpdateSchema.parse({ role, permissions });

  if (isFullAccessRole(parsed.role)) {
    const all = DEFAULT_ROLE_PERMISSIONS[parsed.role];
    if (!all.every((p) => parsed.permissions.includes(p))) {
      throw new Error(`نقش «${ROLE_LABELS[parsed.role]}» باید همیشه تمام دسترسی‌ها را داشته باشد`);
    }
  }

  await seedDefaultRolePermissionsIfEmpty(session.user.id);

  await prisma.rolePermissionConfig.upsert({
    where: { role: parsed.role as UserRole },
    create: {
      role: parsed.role as UserRole,
      permissions: parsed.permissions,
      updatedById: session.user.id,
    },
    update: {
      permissions: parsed.permissions,
      updatedById: session.user.id,
    },
  });

  await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: 'RolePermissionConfig',
      entityId: parsed.role,
      changes: { permissions: parsed.permissions },
    });

  revalidatePath('/users/permissions');
}

export async function getRolePermissionsForPage() {
  const session = await requirePermission(PERMISSIONS.USER_VIEW);
  await seedDefaultRolePermissionsIfEmpty(session.user.id);
  return getRolePermissionsMap();
}
