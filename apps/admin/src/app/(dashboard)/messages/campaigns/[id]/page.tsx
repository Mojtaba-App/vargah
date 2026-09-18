import { notFound } from 'next/navigation';
import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { MessagesNav } from '@/components/campaigns/messages-nav';
import { CampaignDetailPanel } from '@/components/campaigns/campaign-detail-panel';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { normalizeCampaignFilters } from '@/lib/campaigns/audience';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.MESSAGE_VIEW);
  const session = await requireAuth();
  const { id } = await params;

  const campaign = await prisma.bulkCampaign.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      recipients: {
        orderBy: { createdAt: 'desc' },
        take: 80,
        select: {
          id: true,
          recipient: true,
          name: true,
          status: true,
          errorMessage: true,
          sentAt: true,
        },
      },
    },
  });

  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="جزئیات کمپین" description="مدیریت صف، پیشرفت و گیرندگان" />
      <MessagesNav />
      <CampaignDetailPanel
        canManage={await hasPermissionAsync(session.user.role, PERMISSIONS.MESSAGE_MANAGE)}
        campaign={{
          id: campaign.id,
          title: campaign.title,
          channel: campaign.channel,
          status: campaign.status,
          subject: campaign.subject,
          body: campaign.body,
          filters: normalizeCampaignFilters(campaign.filters),
          totalCount: campaign.totalCount,
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount,
          skippedCount: campaign.skippedCount,
          scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
          startedAt: campaign.startedAt?.toISOString() ?? null,
          completedAt: campaign.completedAt?.toISOString() ?? null,
          createdAt: campaign.createdAt.toISOString(),
          createdByName: campaign.createdBy?.name ?? null,
          recipients: campaign.recipients.map((row) => ({
            ...row,
            sentAt: row.sentAt?.toISOString() ?? null,
          })),
        }}
      />
    </div>
  );
}
