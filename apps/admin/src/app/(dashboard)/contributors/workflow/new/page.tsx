import { prisma } from '@vargah/database';

import { NewCommissionForm } from '@/components/contributors/new-commission-form';
import { PageHeader } from '@/components/ui/data-table';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';

export default async function NewCommissionPage() {
  await requirePermission(PERMISSIONS.CONTRIBUTOR_MANAGE);

  const writers = await prisma.user.findMany({
    where: { role: { in: ['WRITER', 'COPY_EDITOR'] }, status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  const contributors = await prisma.contributor.findMany({
    include: { user: { select: { id: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="سفارش مطلب جدید"
        description="تعریف سوژه و تخصیص به نویسنده"
        backHref="/contributors/workflow"
        backLabel="بازگشت به گردش کار"
      />
      <NewCommissionForm writers={writers} contributors={contributors} />
    </div>
  );
}
