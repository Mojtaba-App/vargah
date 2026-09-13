'use client';

import Link from 'next/link';
import { BulkCampaignStatus, NotificationChannel } from '@vargah/database/enums';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';
import { formatJalali } from '@/lib/utils';

export type CampaignListItem = {
  id: string;
  title: string;
  channel: NotificationChannel;
  status: BulkCampaignStatus;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  scheduledAt: string | null;
  createdAt: string;
  createdByName: string | null;
};

const STATUS_LABELS: Record<BulkCampaignStatus, string> = {
  DRAFT: 'پیش‌نویس',
  QUEUED: 'در صف',
  SENDING: 'در حال ارسال',
  COMPLETED: 'تکمیل‌شده',
  CANCELLED: 'لغو‌شده',
  FAILED: 'ناموفق',
};

const STATUS_VARIANT: Record<
  BulkCampaignStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  DRAFT: 'outline',
  QUEUED: 'secondary',
  SENDING: 'default',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
  FAILED: 'destructive',
};

type CampaignsWorkspaceProps = {
  campaigns: CampaignListItem[];
  canManage: boolean;
};

export function CampaignsWorkspace({ campaigns, canManage }: CampaignsWorkspaceProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{campaigns.length} کمپین</p>
        {canManage && (
          <Link href="/messages/campaigns/new">
            <Button className="rounded-xl">+ کمپین جدید</Button>
          </Link>
        )}
      </div>

      {campaigns.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            هنوز کمپین ارسال دسته‌ای ساخته نشده است.
            {canManage && (
              <>
                {' '}
                از «کمپین جدید» شروع کنید.
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/messages/campaigns/${campaign.id}`}
              className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{campaign.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {campaign.channel === NotificationChannel.EMAIL ? 'ایمیل' : 'پیامک'}
                    {campaign.createdByName ? ` · ${campaign.createdByName}` : ''}
                    {' · '}
                    {formatJalali(campaign.createdAt, true)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[campaign.status]}>
                  {STATUS_LABELS[campaign.status]}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>کل: {campaign.totalCount}</span>
                <span>ارسال‌شده: {campaign.sentCount}</span>
                <span>ناموفق: {campaign.failedCount}</span>
                {campaign.scheduledAt && (
                  <span>زمان‌بندی: {formatJalali(campaign.scheduledAt, true)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
