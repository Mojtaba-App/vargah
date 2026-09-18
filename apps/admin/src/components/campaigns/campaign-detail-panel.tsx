'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  BulkCampaignStatus,
  NotificationChannel,
  NotificationStatus,
} from '@vargah/database/enums';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';

import {
  cancelBulkCampaign,
  deleteBulkCampaign,
  enqueueBulkCampaign,
  processBulkCampaignNow,
} from '@/actions/campaigns';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { isNextRedirect } from '@/lib/action-state';
import { getActionErrorMessage } from '@/lib/settings/errors';
import { CAMPAIGN_SEGMENT_LABELS, type CampaignAudienceFilters } from '@/lib/campaigns/audience';
import { formatJalali } from '@/lib/utils';
import { formatJalaliDate } from '@/lib/date/jalali';

type RecipientRow = {
  id: string;
  recipient: string;
  name: string | null;
  status: NotificationStatus;
  errorMessage: string | null;
  sentAt: string | null;
};

type CampaignDetail = {
  id: string;
  title: string;
  channel: NotificationChannel;
  status: BulkCampaignStatus;
  subject: string | null;
  body: string;
  filters: CampaignAudienceFilters;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdByName: string | null;
  recipients: RecipientRow[];
};

const RECIPIENT_STATUS_LABELS: Record<NotificationStatus, string> = {
  PENDING: 'در صف',
  SENT: 'ارسال‌شده',
  FAILED: 'ناموفق',
  CANCELLED: 'لغو‌شده',
};

const STATUS_LABELS: Record<BulkCampaignStatus, string> = {
  DRAFT: 'پیش‌نویس',
  QUEUED: 'در صف',
  SENDING: 'در حال ارسال',
  COMPLETED: 'تکمیل‌شده',
  CANCELLED: 'لغو‌شده',
  FAILED: 'ناموفق',
};

type CampaignDetailPanelProps = {
  campaign: CampaignDetail;
  canManage: boolean;
};

export function CampaignDetailPanel({ campaign, canManage }: CampaignDetailPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>, success: string) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await fn();
        setMessage(success);
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setError(getActionErrorMessage(err, 'عملیات ناموفق بود'));
      }
    });
  };

  const progress =
    campaign.totalCount > 0
      ? Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalCount) * 100)
      : 0;

  const segment = campaign.filters.segment ?? 'all';

  return (
    <div className="space-y-6">
      {message && (
        <StatusBanner type="success" message={message} onDismiss={() => setMessage(null)} />
      )}
      {error && <StatusBanner type="error" message={error} onDismiss={() => setError(null)} />}

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{campaign.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {campaign.channel === NotificationChannel.EMAIL ? 'ایمیل' : 'پیامک'}
                {campaign.createdByName ? ` · ${campaign.createdByName}` : ''}
                {' · '}
                {formatJalali(campaign.createdAt, true)}
              </p>
            </div>
            <Badge>{STATUS_LABELS[campaign.status]}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="کل صف" value={campaign.totalCount} />
            <Stat label="ارسال‌شده" value={campaign.sentCount} />
            <Stat label="ناموفق" value={campaign.failedCount} />
            <Stat label="پیشرفت" value={`${progress}%`} />
          </div>

          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              {(campaign.status === BulkCampaignStatus.DRAFT ||
                campaign.status === BulkCampaignStatus.CANCELLED) && (
                <LoadingButton
                  className="rounded-xl"
                  loading={pending}
                  onClick={() =>
                    run(() => enqueueBulkCampaign(campaign.id), 'کمپین به صف ارسال اضافه شد')
                  }
                >
                  افزودن به صف
                </LoadingButton>
              )}
              {(campaign.status === BulkCampaignStatus.QUEUED ||
                campaign.status === BulkCampaignStatus.SENDING) && (
                <>
                  <LoadingButton
                    className="rounded-xl"
                    loading={pending}
                    onClick={() =>
                      run(() => processBulkCampaignNow(campaign.id, 40), 'یک دسته از صف پردازش شد')
                    }
                  >
                    ارسال دسته بعدی
                  </LoadingButton>
                  <LoadingButton
                    variant="outline"
                    className="rounded-xl"
                    loading={pending}
                    onClick={() => run(() => cancelBulkCampaign(campaign.id), 'کمپین لغو شد')}
                  >
                    لغو صف
                  </LoadingButton>
                </>
              )}
              {campaign.status !== BulkCampaignStatus.SENDING &&
                campaign.status !== BulkCampaignStatus.QUEUED && (
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    disabled={pending}
                    onClick={() =>
                      run(async () => {
                        await deleteBulkCampaign(campaign.id);
                        router.push('/messages/campaigns');
                      }, 'کمپین حذف شد')
                    }
                  >
                    حذف
                  </Button>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="space-y-3 pt-6">
            <p className="font-semibold">محتوای پیام</p>
            {campaign.subject && (
              <p className="text-sm">
                <span className="text-muted-foreground">موضوع: </span>
                {campaign.subject}
              </p>
            )}
            <pre className="border-border bg-muted/30 rounded-xl border p-3 text-sm whitespace-pre-wrap">
              {campaign.body}
            </pre>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="space-y-3 pt-6">
            <p className="font-semibold">فیلتر مخاطب</p>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>سگمنت: {CAMPAIGN_SEGMENT_LABELS[segment]}</li>
              {campaign.filters.registeredFrom && (
                <li>ثبت‌نام از: {formatJalaliDate(campaign.filters.registeredFrom)}</li>
              )}
              {campaign.filters.registeredTo && (
                <li>ثبت‌نام تا: {formatJalaliDate(campaign.filters.registeredTo)}</li>
              )}
              {campaign.filters.purchasedFrom && (
                <li>خرید از: {formatJalaliDate(campaign.filters.purchasedFrom)}</li>
              )}
              {campaign.filters.purchasedTo && (
                <li>خرید تا: {formatJalaliDate(campaign.filters.purchasedTo)}</li>
              )}
              {campaign.filters.planType && <li>پلن: {campaign.filters.planType}</li>}
              {campaign.filters.search && <li>جستجو: {campaign.filters.search}</li>}
              {campaign.scheduledAt && (
                <li>زمان‌بندی: {formatJalali(campaign.scheduledAt, true)}</li>
              )}
              <li>رد‌شده (بدون گیرنده معتبر): {campaign.skippedCount}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <p className="mb-4 font-semibold">گیرندگان صف (نمونه اخیر)</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-border text-muted-foreground border-b text-start">
                  <th className="px-2 py-2 font-medium">گیرنده</th>
                  <th className="px-2 py-2 font-medium">نام</th>
                  <th className="px-2 py-2 font-medium">وضعیت</th>
                  <th className="px-2 py-2 font-medium">خطا</th>
                </tr>
              </thead>
              <tbody>
                {campaign.recipients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted-foreground px-2 py-8 text-center">
                      هنوز گیرنده‌ای در صف نیست. کمپین را به صف اضافه کنید.
                    </td>
                  </tr>
                ) : (
                  campaign.recipients.map((row) => (
                    <tr key={row.id} className="border-border/60 border-b">
                      <td className="px-2 py-2" dir="ltr">
                        {row.recipient}
                      </td>
                      <td className="px-2 py-2">{row.name ?? '—'}</td>
                      <td className="px-2 py-2">{RECIPIENT_STATUS_LABELS[row.status]}</td>
                      <td className="text-destructive px-2 py-2">{row.errorMessage ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-border rounded-xl border px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
