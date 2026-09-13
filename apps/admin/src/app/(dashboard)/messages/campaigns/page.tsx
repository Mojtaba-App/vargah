import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { MessagesNav } from '@/components/campaigns/messages-nav';
import { CampaignGuide } from '@/components/campaigns/campaign-guide';
import { CampaignsWorkspace } from '@/components/campaigns/campaigns-workspace';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
export default async function CampaignsPage() {
  await requirePermission(PERMISSIONS.MESSAGE_VIEW);
  const session = await requireAuth();

  const campaigns = await prisma.bulkCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true } } },
    take: 100,
  });

  const rows = campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    channel: campaign.channel,
    status: campaign.status,
    totalCount: campaign.totalCount,
    sentCount: campaign.sentCount,
    failedCount: campaign.failedCount,
    scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    createdByName: campaign.createdBy?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="ارسال دسته‌ای"
        description="کمپین‌های ایمیل و پیامک با فیلتر مخاطب و صف ارسال"
      />
      <MessagesNav />
      <CampaignGuide />
      <CampaignsWorkspace
        campaigns={rows}
        canManage={await hasPermissionAsync(session.user.role, PERMISSIONS.MESSAGE_MANAGE)}
      />
    </div>
  );
}
