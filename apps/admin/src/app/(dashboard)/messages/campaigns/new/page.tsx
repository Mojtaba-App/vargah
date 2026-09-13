import { NotificationChannel, prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { MessagesNav } from '@/components/campaigns/messages-nav';
import { CampaignGuide } from '@/components/campaigns/campaign-guide';
import { CampaignComposer } from '@/components/campaigns/campaign-composer';
import { requirePermission } from '@/lib/auth-utils';
import { getSubscriptionPlansConfig } from '@/lib/subscription-plans-config';
import { PERMISSIONS } from '@/lib/permissions';

export default async function NewCampaignPage() {
  await requirePermission(PERMISSIONS.MESSAGE_MANAGE);

  const [templates, plans] = await Promise.all([
    prisma.messageTemplate.findMany({
      where: {
        isActive: true,
        channel: { in: [NotificationChannel.EMAIL, NotificationChannel.SMS] },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        channel: true,
        subject: true,
        body: true,
      },
    }),
    getSubscriptionPlansConfig(),
  ]);

  const planTypes = plans.map((plan) => plan.slug).filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title="کمپین جدید" description="ایجاد ارسال دسته‌ای ایمیل یا پیامک" />
      <MessagesNav />
      <CampaignGuide />
      <CampaignComposer templates={templates} planTypes={planTypes} />
    </div>
  );
}
