'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationChannel } from '@vargah/database/enums';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';

import {
  createBulkCampaign,
  previewCampaignAudience,
} from '@/actions/campaigns';
import {
  CAMPAIGN_SEGMENT_LABELS,
  CAMPAIGN_SEGMENTS,
  type CampaignAudienceFilters,
  type CampaignSegment,
} from '@/lib/campaigns/audience';
import { isNextRedirect } from '@/lib/action-state';
import { getActionErrorMessage } from '@/lib/settings/errors';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { JalaliDateField } from '@/components/ui/form/jalali-date-field';
import { JalaliDateTimeField } from '@/components/ui/form/jalali-datetime-field';

type TemplateOption = {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject: string | null;
  body: string;
};

type CampaignComposerProps = {
  templates: TemplateOption[];
  planTypes: string[];
};

export function CampaignComposer({ templates, planTypes }: CampaignComposerProps) {
  const router = useRouter();
  const [channel, setChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [filters, setFilters] = useState<CampaignAudienceFilters>({ segment: 'all' });
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [counting, startCount] = useTransition();

  const channelTemplates = templates.filter((t) => t.channel === channel);

  useEffect(() => {
    startCount(async () => {
      try {
        const result = await previewCampaignAudience(channel, filters);
        setAudienceCount(result.count);
      } catch {
        setAudienceCount(null);
      }
    });
  }, [channel, filters]);

  const updateFilter = <K extends keyof CampaignAudienceFilters>(
    key: K,
    value: CampaignAudienceFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const template = channelTemplates.find((t) => t.id === id);
    if (!template) return;
    setBody(template.body);
    if (template.subject) setSubject(template.subject);
  };

  const submit = (queueNow: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createBulkCampaign({
          title,
          channel,
          subject: channel === 'EMAIL' ? subject : undefined,
          body,
          templateId: templateId || undefined,
          filters,
          scheduledAt: scheduledAt || undefined,
          queueNow,
        });
        router.push(`/messages/campaigns/${result.id}`);
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setError(getActionErrorMessage(err, 'ایجاد کمپین ناموفق بود'));
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
      <Card className="rounded-2xl">
        <CardContent className="space-y-4 pt-6">
          {error && <StatusBanner type="error" message={error} onDismiss={() => setError(null)} />}

          <div>
            <Label required>عنوان کمپین</Label>
            <Input
              className="mt-2 rounded-xl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً اطلاع‌رسانی شماره جدید"
              disabled={pending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>کانال</Label>
              <Select
                className="mt-2 rounded-xl"
                value={channel}
                disabled={pending}
                onChange={(e) => {
                  const next = e.target.value as 'EMAIL' | 'SMS';
                  setChannel(next);
                  setTemplateId('');
                }}
              >
                <option value="EMAIL">ایمیل</option>
                <option value="SMS">پیامک</option>
              </Select>
            </div>
            <div>
              <Label>قالب آماده (اختیاری)</Label>
              <Select
                className="mt-2 rounded-xl"
                value={templateId}
                disabled={pending}
                onChange={(e) => applyTemplate(e.target.value)}
              >
                <option value="">بدون قالب</option>
                {channelTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {channel === 'EMAIL' && (
            <div>
              <Label required>موضوع ایمیل</Label>
              <Input
                className="mt-2 rounded-xl"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={pending}
              />
            </div>
          )}

          <div>
            <Label required>متن پیام</Label>
            <Textarea
              className="mt-2 rounded-xl"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="سلام {{name}}، ..."
              disabled={pending}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              متغیرهای مجاز: <code dir="ltr">{'{{name}}'}</code> ، <code dir="ltr">{'{{recipient}}'}</code>
            </p>
          </div>

          <JalaliDateTimeField
            id="campaign-scheduled-at"
            label="زمان‌بندی ارسال (اختیاری)"
            value={scheduledAt}
            onChange={setScheduledAt}
            disabled={pending}
            hint="در صورت خالی بودن، پس از افزودن به صف قابل ارسال فوری است"
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <LoadingButton
              type="button"
              className="rounded-xl"
              loading={pending}
              onClick={() => submit(true)}
            >
              ذخیره و افزودن به صف
            </LoadingButton>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={pending}
              onClick={() => submit(false)}
            >
              ذخیره پیش‌نویس
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">فیلتر مخاطبان</p>
              <p className="text-sm text-muted-foreground">
                {counting ? 'در حال شمارش…' : audienceCount === null ? '—' : `${audienceCount} نفر`}
              </p>
            </div>

            <div>
              <Label>سگمنت</Label>
              <Select
                className="mt-2 rounded-xl"
                value={filters.segment ?? 'all'}
                onChange={(e) => updateFilter('segment', e.target.value as CampaignSegment)}
              >
                {CAMPAIGN_SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>
                    {CAMPAIGN_SEGMENT_LABELS[segment]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <JalaliDateField
                id="campaign-registered-from"
                label="ثبت‌نام از"
                value={filters.registeredFrom ?? ''}
                onChange={(iso) => updateFilter('registeredFrom', iso || undefined)}
                boundary="start"
                showPresets={false}
                enableLabel="انتخاب تاریخ"
                disabled={pending}
              />
              <JalaliDateField
                id="campaign-registered-to"
                label="ثبت‌نام تا"
                value={filters.registeredTo ?? ''}
                onChange={(iso) => updateFilter('registeredTo', iso || undefined)}
                boundary="end"
                showPresets={false}
                enableLabel="انتخاب تاریخ"
                disabled={pending}
                minDate={filters.registeredFrom}
              />
              <JalaliDateField
                id="campaign-purchased-from"
                label="خرید از"
                value={filters.purchasedFrom ?? ''}
                onChange={(iso) => updateFilter('purchasedFrom', iso || undefined)}
                boundary="start"
                showPresets={false}
                enableLabel="انتخاب تاریخ"
                disabled={pending}
              />
              <JalaliDateField
                id="campaign-purchased-to"
                label="خرید تا"
                value={filters.purchasedTo ?? ''}
                onChange={(iso) => updateFilter('purchasedTo', iso || undefined)}
                boundary="end"
                showPresets={false}
                enableLabel="انتخاب تاریخ"
                disabled={pending}
                minDate={filters.purchasedFrom}
              />
            </div>

            <div>
              <Label>پلن اشتراک</Label>
              <Select
                className="mt-2 rounded-xl"
                value={filters.planType ?? ''}
                onChange={(e) => updateFilter('planType', e.target.value)}
              >
                <option value="">همه پلن‌ها</option>
                {planTypes.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>جستجو (نام / ایمیل / موبایل)</Label>
              <Input
                className="mt-2 rounded-xl"
                value={filters.search ?? ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="اختیاری"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
