import { UserRole } from '@vargah/database/enums';

import { isFullAccessRole } from '@/lib/permissions';

const STAFF_ROLES: UserRole[] = [
  UserRole.EDITOR_IN_CHIEF,
  UserRole.COPY_EDITOR,
  UserRole.WRITER,
  UserRole.AD_MANAGER,
];

/** نقش‌هایی که هر نقش می‌تواند به کاربر جدید اختصاص دهد */
export const ASSIGNABLE_ROLES_BY_ACTOR: Partial<Record<UserRole, UserRole[]>> = {
  [UserRole.SUPER_ADMIN]: [
    UserRole.SUPER_ADMIN,
    UserRole.PUBLISHER,
    UserRole.MANAGING_DIRECTOR,
    ...STAFF_ROLES,
  ],
  [UserRole.PUBLISHER]: [UserRole.MANAGING_DIRECTOR, ...STAFF_ROLES],
  [UserRole.MANAGING_DIRECTOR]: [UserRole.COPY_EDITOR, UserRole.WRITER, UserRole.AD_MANAGER],
  [UserRole.EDITOR_IN_CHIEF]: [UserRole.COPY_EDITOR, UserRole.WRITER, UserRole.AD_MANAGER],
};

const PROTECTED_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.PUBLISHER,
  UserRole.MANAGING_DIRECTOR,
  UserRole.EDITOR_IN_CHIEF,
]);

export function getAssignableRoles(actorRole: UserRole): UserRole[] {
  return ASSIGNABLE_ROLES_BY_ACTOR[actorRole] ?? [];
}

export function canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
  return getAssignableRoles(actorRole).includes(targetRole);
}

export function isProtectedAdminUser(role: UserRole): boolean {
  return PROTECTED_ROLES.has(role);
}

export function canActorManageTarget(
  actorRole: UserRole,
  targetRole: UserRole,
  actorId: string,
  targetId: string,
): boolean {
  if (actorId === targetId) return true;
  if (actorRole === UserRole.SUPER_ADMIN) return true;
  if (actorRole === UserRole.PUBLISHER) {
    return targetRole !== UserRole.SUPER_ADMIN && targetRole !== UserRole.PUBLISHER;
  }
  if (actorRole === UserRole.MANAGING_DIRECTOR) {
    return (
      targetRole === UserRole.EDITOR_IN_CHIEF ||
      targetRole === UserRole.COPY_EDITOR ||
      targetRole === UserRole.WRITER ||
      targetRole === UserRole.AD_MANAGER
    );
  }
  if (actorRole === UserRole.EDITOR_IN_CHIEF) {
    return !isProtectedAdminUser(targetRole);
  }
  return false;
}

export function canActorDeleteTarget(
  actorRole: UserRole,
  targetRole: UserRole,
  actorId: string,
  targetId: string,
): boolean {
  if (actorId === targetId) return false;
  if (actorRole !== UserRole.SUPER_ADMIN) return false;
  if (isFullAccessRole(targetRole)) return false;
  return true;
}

export function canActorChangeRole(
  actorRole: UserRole,
  currentTargetRole: UserRole,
  nextRole: UserRole,
): boolean {
  if (!canAssignRole(actorRole, nextRole)) return false;
  if (actorRole === UserRole.SUPER_ADMIN) return true;
  if (actorRole === UserRole.PUBLISHER) {
    return currentTargetRole !== UserRole.SUPER_ADMIN && currentTargetRole !== UserRole.PUBLISHER;
  }
  if (actorRole === UserRole.MANAGING_DIRECTOR || actorRole === UserRole.EDITOR_IN_CHIEF) {
    return !isProtectedAdminUser(currentTargetRole) && !isProtectedAdminUser(nextRole);
  }
  return false;
}
