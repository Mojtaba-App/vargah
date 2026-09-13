import { notFound } from 'next/navigation';
import { prisma } from '@vargah/database';
import { Badge } from '@vargah/ui/components/badge';
import { PageHeader } from '@/components/ui/data-table';
import { EditUserForm } from '@/components/users/edit-user-form';
import { requireAuth } from '@/lib/auth-utils';
import { PERMISSIONS, ROLE_LABELS, ADMIN_ROLES } from '@/lib/permissions';
import { hasAnyPermissionAsync } from '@/lib/permissions-server';
import {
  canActorDeleteTarget,
  canActorManageTarget,
  getAssignableRoles,
} from '@/lib/users/policy';
import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;

  const canView = await hasAnyPermissionAsync(session.user.role, [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_MANAGE,
  ]);
  if (!canView) redirect('/users?error=forbidden');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !ADMIN_ROLES.includes(user.role)) notFound();

  const isSelf = session.user.id === user.id;
  const canManageTarget = canActorManageTarget(
    session.user.role,
    user.role,
    session.user.id,
    user.id,
  );

  if (!isSelf && !canManageTarget) redirect('/users?error=forbidden');

  const assignableRoles = isSelf
    ? [user.role]
    : getAssignableRoles(session.user.role).includes(user.role)
      ? getAssignableRoles(session.user.role)
      : [user.role];

  const [canChangePassword, canDelete] = await Promise.all([
    hasAnyPermissionAsync(session.user.role, [PERMISSIONS.USER_MANAGE, PERMISSIONS.USER_EDIT]),
    hasAnyPermissionAsync(session.user.role, [PERMISSIONS.USER_MANAGE]).then(
      (allowed) =>
        allowed &&
        canActorDeleteTarget(session.user.role, user.role, session.user.id, user.id),
    ),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ویرایش کاربر"
        description={user.name ?? user.email ?? ''}
        backHref="/users"
        backLabel="بازگشت به کاربران"
        action={<Badge>{ROLE_LABELS[user.role]}</Badge>}
      />
      <EditUserForm
        user={user}
        assignableRoles={assignableRoles}
        canDelete={canDelete}
        canChangePassword={canChangePassword || isSelf}
        isSelf={isSelf}
      />
    </div>
  );
}
