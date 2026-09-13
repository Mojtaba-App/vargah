import { PageHeader } from '@/components/ui/data-table';
import { ContributorsWorkspace } from '@/components/contributors/contributors-workspace';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { loadContributorsWorkspaceData } from '@/lib/contributors/load-workspace-data';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
export default async function WorkflowPage() {
  await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);
  const session = await requireAuth();
  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.CONTRIBUTOR_MANAGE);
  const data = await loadContributorsWorkspaceData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="گردش کار سفارش مطلب"
        description="سردبیر → تعریف سوژه → تخصیص → نگارش → بازبینی → تأیید"
        backHref="/contributors"
        backLabel="بازگشت به همکاران"
      />
      <ContributorsWorkspace {...data} canManage={canManage} defaultTab="commissions" />
    </div>
  );
}
