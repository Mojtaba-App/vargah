import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { DiscountsWorkspace } from '@/components/discounts/discounts-workspace';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { getSubscriptionPlansConfig } from '@/lib/subscription-plans-config';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';

export default async function DiscountsPage() {
  await requirePermission(PERMISSIONS.DISCOUNT_VIEW);
  const session = await requireAuth();
  const [codes, plans] = await Promise.all([
    prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    }),
    getSubscriptionPlansConfig(),
  ]);

  const canManage = await hasPermissionAsync(session.user.role, PERMISSIONS.DISCOUNT_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="تخفیف‌ها"
        description="ساخت و مدیریت کد تخفیف عمومی یا مخصوص محصول — همراه با سقف استفاده و بازه اعتبار"
      />
      <DiscountsWorkspace codes={codes} plans={plans} canManage={canManage} />
    </div>
  );
}
