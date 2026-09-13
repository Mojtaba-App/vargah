import { PageHeader } from '@/components/ui/data-table';
import { PermissionsMatrixEditor } from '@/components/users/permissions-matrix-editor';
import { getRolePermissionsForPage } from '@/actions/users';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';

export default async function PermissionsPage() {
  await requirePermission(PERMISSIONS.USER_VIEW);
  const session = await requireAuth();
  const matrix = await getRolePermissionsForPage();
  const canEdit = await hasPermissionAsync(session.user.role, PERMISSIONS.ROLE_PERMISSION_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ماتریس دسترسی"
        description="نقش‌ها و وظایف (Permissions) — قابل ویرایش توسط مدیر کل"
        backHref="/users"
        backLabel="بازگشت به کاربران"
      />
      <PermissionsMatrixEditor initialMatrix={matrix} canEdit={canEdit} />
    </div>
  );
}
