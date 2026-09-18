'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SMS_TEMPLATE_PRESETS } from '@vargah/business/sms-presets';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { Input, Label, Textarea } from '@vargah/ui/components/input';

import {
  createSmsTemplateFromPreset,
  deleteMessageTemplate,
  toggleMessageTemplate,
  upsertMessageTemplate,
} from '@/actions/messaging';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { WorkspaceSearchField } from '@/components/ui/workspace-search-field';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { NotificationChannel } from '@/lib/communications/enums';
import { getActionErrorMessage } from '@/lib/settings/errors';
import { CHANNEL_LABELS, TemplateChannelFilter } from '@/lib/settings/constants';
import { cn, formatNumber } from '@/lib/utils';

export type MessageTemplateRow = {
  id: string;
  key: string;
  name: string;
  channel: NotificationChannel;
  subject: string | null;
  body: string;
  externalTemplateId: string | null;
  variables: string[];
  isActive: boolean;
};

type TemplatesManagerProps = {
  templates: MessageTemplateRow[];
  canEdit: boolean;
  /** وقتی تنظیم شود، فقط الگوهای همان کانال نمایش داده می‌شوند */
  channel?: NotificationChannel;
};

const EMPTY_FORM = {
  key: '',
  name: '',
  channel: NotificationChannel.SMS as NotificationChannel,
  subject: '',
  body: '',
  externalTemplateId: '',
  variables: '',
};

export function TemplatesManager({ templates, canEdit, channel }: TemplatesManagerProps) {
  const scopedTemplates = useMemo(
    () => (channel ? templates.filter((t) => t.channel === channel) : templates),
    [templates, channel],
  );
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, channel: channel ?? NotificationChannel.SMS });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MessageTemplateRow | null>(null);
  const [channelFilter, setChannelFilter] = useState<TemplateChannelFilter>(channel ?? 'ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [isPending, startTransition] = useTransition();
  const [presetKey, setPresetKey] = useState('');

  const stats = useMemo(
    () => ({
      total: scopedTemplates.length,
      sms: scopedTemplates.filter((t) => t.channel === NotificationChannel.SMS).length,
      email: scopedTemplates.filter((t) => t.channel === NotificationChannel.EMAIL).length,
      active: scopedTemplates.filter((t) => t.isActive).length,
    }),
    [scopedTemplates],
  );

  const availablePresets = useMemo(
    () =>
      channel === NotificationChannel.EMAIL
        ? []
        : SMS_TEMPLATE_PRESETS.filter(
            (preset) => !scopedTemplates.some((t) => t.key === preset.key),
          ),
    [scopedTemplates, channel],
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return scopedTemplates.filter((t) => {
      if (!channel && channelFilter !== 'ALL' && t.channel !== channelFilter) return false;
      if (!q) return true;
      return [t.name, t.key, t.body, CHANNEL_LABELS[t.channel]].join(' ').toLowerCase().includes(q);
    });
  }, [scopedTemplates, channel, channelFilter, debouncedSearch]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, channel: channel ?? NotificationChannel.SMS });
    setEditingId(null);
    setPresetKey('');
  };

  const loadTemplate = (template: MessageTemplateRow) => {
    setEditingId(template.id);
    setForm({
      key: template.key,
      name: template.name,
      channel: template.channel,
      subject: template.subject ?? '',
      body: template.body,
      externalTemplateId: template.externalTemplateId ?? '',
      variables: template.variables.join(', '),
    });
    setPresetKey('');
  };

  const handleAddPreset = () => {
    if (!presetKey || !canEdit) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await createSmsTemplateFromPreset(presetKey);
        setMessage('الگوی آماده اضافه شد.');
        resetForm();
        router.refresh();
      } catch (err) {
        setError(getActionErrorMessage(err, 'افزودن الگو ناموفق بود.'));
      }
    });
  };

  const handleSave = () => {
    if (!canEdit) return;
    if (!form.key.trim() || !form.name.trim() || !form.body.trim()) {
      setError('کلید، نام و متن الگو الزامی است.');
      return;
    }

    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await upsertMessageTemplate({
          key: form.key.trim(),
          name: form.name.trim(),
          channel: channel ?? form.channel,
          subject:
            form.channel === NotificationChannel.EMAIL
              ? form.subject.trim() || undefined
              : undefined,
          body: form.body,
          externalTemplateId: form.externalTemplateId.trim() || undefined,
          variables: form.variables
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
        });
        setMessage(editingId ? 'الگو به‌روزرسانی شد.' : 'الگوی جدید ذخیره شد.');
        resetForm();
        router.refresh();
      } catch (err) {
        setError(getActionErrorMessage(err, 'ذخیره الگو ناموفق بود.'));
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget || !canEdit) return;
    startTransition(async () => {
      try {
        await deleteMessageTemplate(deleteTarget.id);
        setMessage('الگو حذف شد.');
        if (editingId === deleteTarget.id) resetForm();
        setDeleteTarget(null);
        router.refresh();
      } catch (err) {
        setError(getActionErrorMessage(err, 'حذف الگو ناموفق بود.'));
      }
    });
  };

  const handleToggle = (template: MessageTemplateRow) => {
    if (!canEdit) return;
    startTransition(async () => {
      try {
        await toggleMessageTemplate(template.id, !template.isActive);
        router.refresh();
      } catch (err) {
        setError(getActionErrorMessage(err, 'تغییر وضعیت الگو ناموفق بود.'));
      }
    });
  };

  const applyPresetToForm = (key: string) => {
    const preset = SMS_TEMPLATE_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setPresetKey(key);
    setEditingId(null);
    setForm({
      key: preset.key,
      name: preset.name,
      channel: NotificationChannel.SMS,
      subject: '',
      body: preset.body,
      externalTemplateId: '',
      variables: preset.variables.join(', '),
    });
  };

  return (
    <div className={channel ? 'space-y-4' : 'space-y-6'}>
      {(error || message) && (
        <StatusBanner
          type={error ? 'error' : 'success'}
          message={error ?? message!}
          onDismiss={error ? undefined : () => setMessage(null)}
        />
      )}

      {!channel && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'کل الگوها', value: stats.total, filter: 'ALL' as const },
            { label: 'پیامک', value: stats.sms, filter: NotificationChannel.SMS },
            { label: 'ایمیل', value: stats.email, filter: NotificationChannel.EMAIL },
            { label: 'فعال', value: stats.active },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.filter && setChannelFilter(item.filter)}
              className={cn(
                'border-border bg-card rounded-2xl border p-4 text-start transition-colors',
                item.filter &&
                  channelFilter === item.filter &&
                  'border-primary ring-primary/20 ring-1',
                item.filter && 'hover:border-primary/40',
              )}
            >
              <p className="text-2xl font-bold tabular-nums">{formatNumber(item.value)}</p>
              <p className="text-muted-foreground mt-1 text-sm">{item.label}</p>
            </button>
          ))}
        </div>
      )}

      <div className={cn('flex flex-col gap-4', !channel && 'lg:flex-row lg:items-end')}>
        <WorkspaceSearchField
          id={channel ? `template-search-${channel}` : 'template-search'}
          value={search}
          onChange={setSearch}
          placeholder="نام، کلید، متن..."
        />
        {!channel && (
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as TemplateChannelFilter)}
            className="border-border bg-background h-10 rounded-xl border px-3 text-sm"
          >
            <option value="ALL">همه کانال‌ها</option>
            <option value={NotificationChannel.SMS}>
              {CHANNEL_LABELS[NotificationChannel.SMS]}
            </option>
            <option value={NotificationChannel.EMAIL}>
              {CHANNEL_LABELS[NotificationChannel.EMAIL]}
            </option>
          </select>
        )}
      </div>

      {canEdit && availablePresets.length > 0 && (
        <div className="border-border/80 flex flex-wrap items-end gap-3 rounded-xl border border-dashed p-4">
          <div className="min-w-[220px] flex-1">
            <Label>افزودن از الگوهای آماده پیامک</Label>
            <select
              value={presetKey}
              onChange={(e) => {
                const value = e.target.value;
                setPresetKey(value);
                if (value) applyPresetToForm(value);
              }}
              className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">انتخاب الگو...</option>
              {availablePresets.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
          <LoadingButton
            type="button"
            variant="outline"
            className="rounded-xl"
            loading={isPending}
            loadingText="در حال افزودن..."
            onClick={handleAddPreset}
            disabled={!presetKey}
          >
            افزودن سریع
          </LoadingButton>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm">الگویی یافت نشد.</p>}
        {filtered.map((template) => (
          <div key={template.id} className="border-border/80 rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{template.name}</p>
                  {!channel && <Badge variant="outline">{CHANNEL_LABELS[template.channel]}</Badge>}
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs" dir="ltr">
                  {template.key}
                </p>
                {template.subject && (
                  <p className="text-muted-foreground mt-1 text-sm">موضوع: {template.subject}</p>
                )}
                <p className="text-muted-foreground mt-1 text-sm">{template.body}</p>
                {template.variables.length > 0 && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    متغیرها: {template.variables.join('، ')}
                  </p>
                )}
                {template.externalTemplateId && (
                  <p className="text-muted-foreground mt-1 text-xs" dir="ltr">
                    SMS.ir Template ID: {template.externalTemplateId}
                  </p>
                )}
              </div>
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => loadTemplate(template)}
                  >
                    ویرایش
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={isPending}
                    onClick={() => handleToggle(template)}
                  >
                    {template.isActive ? 'غیرفعال' : 'فعال'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive rounded-lg"
                    onClick={() => setDeleteTarget(template)}
                  >
                    حذف
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="border-border/80 space-y-4 rounded-2xl border p-5">
          <h3 className="font-semibold">{editingId ? 'ویرایش الگو' : 'الگوی جدید'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tplKey">کلید (یکتا)</Label>
              <Input
                id="tplKey"
                dir="ltr"
                value={form.key}
                onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
                disabled={Boolean(editingId) || isPending}
                className="mt-2 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="tplName">نام</Label>
              <Input
                id="tplName"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-2 rounded-xl"
                disabled={isPending}
              />
            </div>
            {!channel && (
              <div>
                <Label htmlFor="tplChannel">کانال</Label>
                <select
                  id="tplChannel"
                  value={form.channel}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, channel: e.target.value as NotificationChannel }))
                  }
                  className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  disabled={Boolean(editingId) || isPending}
                >
                  <option value={NotificationChannel.SMS}>
                    {CHANNEL_LABELS[NotificationChannel.SMS]}
                  </option>
                  <option value={NotificationChannel.EMAIL}>
                    {CHANNEL_LABELS[NotificationChannel.EMAIL]}
                  </option>
                </select>
              </div>
            )}
            {(channel === NotificationChannel.EMAIL ||
              form.channel === NotificationChannel.EMAIL) && (
              <div>
                <Label htmlFor="tplSubject">موضوع ایمیل</Label>
                <Input
                  id="tplSubject"
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="اشتراک {{name}} — {{days}} روز مانده"
                  className="mt-2 rounded-xl"
                  disabled={isPending}
                />
              </div>
            )}
            {(channel === NotificationChannel.SMS || form.channel === NotificationChannel.SMS) && (
              <div>
                <Label htmlFor="tplExternalId">شناسه الگو SMS.ir</Label>
                <Input
                  id="tplExternalId"
                  dir="ltr"
                  value={form.externalTemplateId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, externalTemplateId: e.target.value }))
                  }
                  placeholder="برای SMS.ir الزامی"
                  className="mt-2 rounded-xl"
                  disabled={isPending}
                />
              </div>
            )}
            <div>
              <Label htmlFor="tplVariables">متغیرها (با کاما)</Label>
              <Input
                id="tplVariables"
                dir="ltr"
                placeholder="name, code, link"
                value={form.variables}
                onChange={(e) => setForm((prev) => ({ ...prev, variables: e.target.value }))}
                className="mt-2 rounded-xl"
                disabled={isPending}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tplBody">متن الگو — از {'{{name}}'} برای متغیر استفاده کنید</Label>
            <Textarea
              id="tplBody"
              rows={4}
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              className="mt-2 rounded-xl"
              disabled={isPending}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {(editingId || form.key) && (
              <Button type="button" variant="outline" className="rounded-xl" onClick={resetForm}>
                انصراف
              </Button>
            )}
            <LoadingButton
              type="button"
              className="rounded-xl px-6"
              loading={isPending}
              loadingText="در حال ذخیره..."
              onClick={handleSave}
            >
              {editingId ? 'به‌روزرسانی الگو' : 'ذخیره الگو'}
            </LoadingButton>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الگو"
        description={`آیا از حذف الگوی «${deleteTarget?.name}» مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
