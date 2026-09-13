import { PageHeader } from '@/components/ui/data-table';
import { SubscriptionPlansManager } from '@/components/subscription-plans/subscription-plans-manager';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { getSubscriptionPlansConfig } from '@/lib/subscription-plans-config';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';

export default async function SubscriptionPlansPage() {
  await requirePermission(PERMISSIONS.PLAN_VIEW);
  const session = await requireAuth();
  const plans = await getSubscriptionPlansConfig();
  const canEdit = await hasPermissionAsync(session.user.role, PERMISSIONS.PLAN_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="پلن‌های اشتراک"
        description="محصولات اشتراک سایت — قیمت، تخفیف محصول، دوره و نمایش در صفحه خرید اشتراک"
      />
      <SubscriptionPlansManager initialPlans={plans} canEdit={canEdit} />
    </div>
  );
}
