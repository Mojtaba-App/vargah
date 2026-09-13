import { UserRole } from '@vargah/database/enums';

/** نقش‌هایی که 2FA برای آن‌ها اجباری است (وقتی فعال باشد) */
export const MANDATORY_2FA_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.PUBLISHER,
  UserRole.MANAGING_DIRECTOR,
  UserRole.EDITOR_IN_CHIEF,
] as const;

export type Mandatory2FARole = (typeof MANDATORY_2FA_ROLES)[number];

const mandatorySet = new Set<string>(MANDATORY_2FA_ROLES);

/**
 * در production به‌صورت پیش‌فرض فعال است مگر صریحاً خاموش شود.
 * در development فقط با MANDATORY_2FA_ENABLED=true روشن می‌شود.
 */
export function isMandatory2FAEnabled(): boolean {
  if (process.env.MANDATORY_2FA_ENABLED === 'false') return false;
  if (process.env.MANDATORY_2FA_ENABLED === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

export function requiresMandatory2FA(role: string): boolean {
  if (!isMandatory2FAEnabled()) return false;
  return mandatorySet.has(role);
}
