import { cache } from 'react';
import { prisma, UserRole } from '@vargah/database';

import { DEFAULT_ROLE_PERMISSIONS, type Permission, PERMISSIONS } from '@/lib/permissions';

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/** دسترسی‌هایی که بعد از seed اولیه به کد اضافه شده‌اند و باید به ماتریس DB الحاق شوند */
const NEW_PERMISSIONS_TO_BACKFILL: Permission[] = [
  PERMISSIONS.DISCOUNT_VIEW,
  PERMISSIONS.DISCOUNT_MANAGE,
  PERMISSIONS.CHAT_VIEW,
  PERMISSIONS.CHAT_MANAGE,
];

function isPermission(value: string): value is Permission {
  return Object.values(PERMISSIONS).includes(value as Permission);
}

function sanitizePermissions(permissions: string[]): Permission[] {
  return permissions.filter(isPermission);
}

/** بارگذاری ماتریس دسترسی از DB با fallback به پیش‌فرض */
export const getRolePermissionsMap = cache(async (): Promise<Record<UserRole, Permission[]>> => {
  const map: Record<UserRole, Permission[]> = {
    ...DEFAULT_ROLE_PERMISSIONS,
    [UserRole.SUBSCRIBER]: [],
  };

  try {
    const configs = await prisma.rolePermissionConfig.findMany();
    for (const config of configs) {
      const stored = sanitizePermissions(config.permissions);
      const defaults = DEFAULT_ROLE_PERMISSIONS[config.role] ?? [];
      const backfill = NEW_PERMISSIONS_TO_BACKFILL.filter(
        (permission) => defaults.includes(permission) && !stored.includes(permission),
      );
      map[config.role] = [...stored, ...backfill];
    }
  } catch {
    // جدول هنوز migrate نشده — از پیش‌فرض استفاده می‌شود
  }

  // نقش‌های با دسترسی کامل همیشه همه مجوزهای فعلی کد را دارند
  for (const role of [
    UserRole.SUPER_ADMIN,
    UserRole.PUBLISHER,
    UserRole.MANAGING_DIRECTOR,
  ] as const) {
    map[role] = ALL_PERMISSIONS;
  }

  return map;
});

export async function getPermissionsForRole(role: UserRole): Promise<Permission[]> {
  const map = await getRolePermissionsMap();
  return map[role] ?? [];
}

export async function hasPermissionAsync(role: UserRole, permission: Permission): Promise<boolean> {
  const map = await getRolePermissionsMap();
  return map[role]?.includes(permission) ?? false;
}

export async function hasAnyPermissionAsync(
  role: UserRole,
  permissions: Permission[],
): Promise<boolean> {
  const granted = await getPermissionsForRole(role);
  return permissions.some((p) => granted.includes(p));
}

export async function seedDefaultRolePermissionsIfEmpty(updatedById?: string): Promise<void> {
  const existing = await prisma.rolePermissionConfig.count();
  if (existing > 0) return;

  const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS) as UserRole[];
  await prisma.$transaction(
    roles.map((role) =>
      prisma.rolePermissionConfig.create({
        data: {
          role,
          permissions: DEFAULT_ROLE_PERMISSIONS[role],
          updatedById,
        },
      }),
    ),
  );
}
