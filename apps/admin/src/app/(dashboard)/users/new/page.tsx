import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/ui/data-table';
import { CreateUserForm } from '@/components/users/create-user-form';
import { requireAuth } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasAnyPermissionAsync } from '@/lib/permissions-server';
import { getAssignableRoles } from '@/lib/users/policy';
import { redirect } from 'next/navigation';

export default async function NewUserPage() {
  const session = await requireAuth();
  const canCreate = await hasAnyPermissionAsync(session.user.role, [
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.USER_CREATE,
  ]);

  if (!canCreate) redirect('/users?error=forbidden');

  const assignableRoles = getAssignableRoles(session.user.role);
  if (assignableRoles.length === 0) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="کاربر جدید"
        description="ایجاد حساب ادمین با نقش و رمز عبور امن"
        backHref="/users"
        backLabel="بازگشت به کاربران"
      />
      <CreateUserForm assignableRoles={assignableRoles} />
    </div>
  );
}
