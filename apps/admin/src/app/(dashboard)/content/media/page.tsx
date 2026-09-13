import { prisma } from '@vargah/database';

import { MediaWorkspace } from '@/components/content/media-workspace';
import { PageHeader } from '@/components/ui/data-table';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';

export default async function MediaPage() {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="کتابخانه رسانه"
        description="تصاویر و فایل‌ها با جستجو، آپلود و برچسب‌گذاری"
      />
      <MediaWorkspace assets={assets} />
    </div>
  );
}
