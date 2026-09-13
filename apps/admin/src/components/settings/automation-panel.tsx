'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { Input, Label } from '@vargah/ui/components/input';
import { Card, CardContent } from '@vargah/ui/components/card';

import { deleteWebhook, runRemindersNow, testWebhookSettings, toggleWebhook, upsertWebhook } from '@/actions/automation';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import {
  NotificationChannel,
  WEBHOOK_EVENT_OPTIONS,
  WEBHOOK_PROVIDER_ORDER,
  WebhookProvider,
} from '@/lib/communications/enums';
import { getActionErrorMessage, formatWebhookFeedbackMessage } from '@/lib/settings/errors';
import {
  CHANNEL_LABELS,
  NOTIFICATION_STATUS_LABELS,
  NOTIFICATION_STATUS_VARIANT,
  NotificationStatus,
  WEBHOOK_PROVIDER_HINTS,
  WEBHOOK_PROVIDER_LABELS,
  WEBHOOK_SECRET_LABELS,
  WEBHOOK_URL_PLACEHOLDERS,
} from '@/lib/settings/constants';
import { cn, formatJalali, formatNumber } from '@/lib/utils';

export type WebhookRow = {
  id: string;
  name: string;
  url: string;
  provider: WebhookProvider;
  secret: string | null;
  events: string[];
  isActive: boolean;
  createdAt: Date;
};

export type NotificationRow = {
  id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipient: string;
  subject: string | null;
  body: string;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
};

type AutomationPanelProps = {
  webhooks: WebhookRow[];
  notifications: NotificationRow[];
  canEdit: boolean;
};

type ProviderFormState = {
  name: string;
  url: string;
  secret: string;
  events: string[];
};

type ProviderUiState = {
  form: ProviderFormState;
  editingId: string | null;
  message: string | null;
  error: string | null;
};

const DEFAULT_EVENTS = ['ticket.created', 'commission.deadline'];

function emptyForm(): ProviderFormState {
  return {
    name: '',
    url: '',
    secret: '',
    events: [...DEFAULT_EVENTS],
  };
}

function createInitialProviderState(): Record<WebhookProvider, ProviderUiState> {
  return Object.fromEntries(
    WEBHOOK_PROVIDER_ORDER.map((provider) => [
      provider,
      { form: emptyForm(), editingId: null, message: null, error: null },
    ]),
  ) as Record<WebhookProvider, ProviderUiState>;
}

export function AutomationPanel({ webhooks, notifications, canEdit }: AutomationPanelProps) {
  const router = useRouter();
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [providerState, setProviderState] = useState(createInitialProviderState);
  const [activeProvider, setActiveProvider] = useState<WebhookProvider>(WebhookProvider.TELEGRAM);
  const [deleteTarget, setDeleteTarget] = useState<WebhookRow | null>(null);
  const [notificationFilter, setNotificationFilter] = useState<NotificationStatus | 'ALL'>('ALL');
  const [testingWebhookKey, setTestingWebhookKey] = useState<string | null>(null);

  const webhooksByProvider = useMemo(() => {
    const map = Object.fromEntries(WEBHOOK_PROVIDER_ORDER.map((p) => [p, [] as WebhookRow[]])) as Record<
      WebhookProvider,
      WebhookRow[]
    >;
    for (const webhook of webhooks) {
      (map[webhook.provider] ?? map.GENERIC).push(webhook);
    }
    return map;
  }, [webhooks]);

  const stats = useMemo(
    () => ({
      activeWebhooks: webhooks.filter((w) => w.isActive).length,
      totalWebhooks: webhooks.length,
      failedNotifications: notifications.filter((n) => n.status === NotificationStatus.FAILED).length,
      sentToday: notifications.filter((n) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return n.status === NotificationStatus.SENT && n.sentAt && n.sentAt >= today;
      }).length,
      byProvider: WEBHOOK_PROVIDER_ORDER.map((provider) => ({
        provider,
        count: webhooksByProvider[provider].length,
        active: webhooksByProvider[provider].filter((w) => w.isActive).length,
      })),
    }),
    [webhooks, notifications, webhooksByProvider],
  );

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'ALL') return notifications;
    return notifications.filter((n) => n.status === notificationFilter);
  }, [notifications, notificationFilter]);

  const patchProvider = (provider: WebhookProvider, patch: Partial<ProviderUiState>) => {
    setProviderState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], ...patch },
    }));
  };

  const patchForm = (provider: WebhookProvider, patch: Partial<ProviderFormState>) => {
    setProviderState((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        form: { ...prev[provider].form, ...patch },
      },
    }));
  };

  const resetProviderForm = (provider: WebhookProvider) => {
    patchProvider(provider, { form: emptyForm(), editingId: null });
  };

  const loadWebhook = (webhook: WebhookRow) => {
    setActiveProvider(webhook.provider);
    patchProvider(webhook.provider, {
      editingId: webhook.id,
      form: {
        name: webhook.name,
        url: webhook.url,
        secret: webhook.secret ?? '',
        events: webhook.events.length > 0 ? webhook.events : [...DEFAULT_EVENTS],
      },
      error: null,
      message: null,
    });
  };

  const runReminders = () => {
    if (!canEdit) return;
    setReminderError(null);
    setReminderMessage(null);
    startTransition(async () => {
      try {
        await runRemindersNow();
        setReminderMessage('یادآورها با موفقیت اجرا شدند.');
        router.refresh();
      } catch (err) {
        setReminderError(getActionErrorMessage(err, 'اجرای یادآورها ناموفق بود.'));
      }
    });
  };

  const saveWebhook = (provider: WebhookProvider) => {
    if (!canEdit) return;
    const state = providerState[provider];
    if (!state.form.name.trim() || !state.form.url.trim()) {
      patchProvider(provider, { error: 'نام و URL الزامی است.', message: null });
      return;
    }
    if (state.form.events.length === 0) {
      patchProvider(provider, { error: 'حداقل یک رویداد انتخاب کنید.', message: null });
      return;
    }

    patchProvider(provider, { error: null, message: null });
    startTransition(async () => {
      try {
        await upsertWebhook({
          id: state.editingId ?? undefined,
          name: state.form.name.trim(),
          url: state.form.url.trim(),
          provider,
          secret: state.form.secret.trim() || undefined,
          events: state.form.events,
        });
        patchProvider(provider, {
          message: state.editingId ? 'اتصال این بخش به‌روزرسانی شد.' : 'اتصال جدید برای این بخش ذخیره شد.',
          form: emptyForm(),
          editingId: null,
        });
        router.refresh();
      } catch (err) {
        patchProvider(provider, {
          error: getActionErrorMessage(err, 'ذخیره اتصال ناموفق بود.'),
          message: null,
        });
      }
    });
  };

  const handleToggleWebhook = (webhook: WebhookRow) => {
    if (!canEdit) return;
    startTransition(async () => {
      try {
        await toggleWebhook(webhook.id, !webhook.isActive);
        router.refresh();
      } catch (err) {
        patchProvider(webhook.provider, {
          error: getActionErrorMessage(err, 'تغییر وضعیت اتصال ناموفق بود.'),
          message: null,
        });
      }
    });
  };

  const handleDeleteWebhook = () => {
    if (!deleteTarget || !canEdit) return;
    const provider = deleteTarget.provider;
    startTransition(async () => {
      try {
        await deleteWebhook(deleteTarget.id);
        if (providerState[provider].editingId === deleteTarget.id) {
          resetProviderForm(provider);
        }
        patchProvider(provider, { message: 'اتصال حذف شد.', error: null });
        setDeleteTarget(null);
        router.refresh();
      } catch (err) {
        patchProvider(provider, {
          error: getActionErrorMessage(err, 'حذف اتصال ناموفق بود.'),
          message: null,
        });
      }
    });
  };

  const runWebhookTest = async (input: {
    key: string;
    url: string;
    provider: WebhookProvider;
    secret?: string;
    webhookId?: string;
  }) => {
    if (!canEdit) return;
    patchProvider(input.provider, { error: null, message: null });
    setTestingWebhookKey(input.key);
    const result = await testWebhookSettings({
      url: input.url,
      provider: input.provider,
      secret: input.secret,
      webhookId: input.webhookId,
    });
    if (result.ok) {
      patchProvider(input.provider, { message: formatWebhookFeedbackMessage(result.message) });
    } else {
      patchProvider(input.provider, {
        error: formatWebhookFeedbackMessage(result.message),
        message: null,
      });
    }
    setTestingWebhookKey(null);
  };

  const toggleEvent = (provider: WebhookProvider, event: string) => {
    const current = providerState[provider].form.events;
    const next = current.includes(event) ? current.filter((e) => e !== event) : [...current, event];
    patchForm(provider, { events: next });
  };

  const activeState = providerState[activeProvider];
  const activeList = webhooksByProvider[activeProvider];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Webhook فعال', value: stats.activeWebhooks, hint: `${formatNumber(stats.totalWebhooks)} کل` },
          { label: 'ارسال موفق امروز', value: stats.sentToday },
          {
            label: 'اعلان ناموفق',
            value: stats.failedNotifications,
            tone: stats.failedNotifications > 0 ? 'danger' : undefined,
          },
          { label: 'کل اعلان‌های اخیر', value: notifications.length },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p
              className={cn(
                'mt-1 text-2xl font-bold tabular-nums',
                item.tone === 'danger' && 'text-rose-600 dark:text-rose-400',
              )}
            >
              {formatNumber(item.value)}
            </p>
            {item.hint && <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>}
          </div>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 pt-6">
          {(reminderError || reminderMessage) && (
            <StatusBanner
              type={reminderError ? 'error' : 'success'}
              message={reminderError ?? reminderMessage!}
              onDismiss={reminderError ? undefined : () => setReminderMessage(null)}
            />
          )}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">اجرای یادآورها</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                اشتراک (۷ و ۱ روز مانده) + Deadline سفارش مطلب — اجرای دستی برای تست
              </p>
            </div>
            {canEdit && (
              <LoadingButton
                type="button"
                className="rounded-xl"
                loading={isPending}
                loadingText="در حال اجرا..."
                onClick={runReminders}
              >
                اجرای دستی یادآورها
              </LoadingButton>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-5 pt-6">
          <div>
            <h3 className="font-semibold">اتصال به برنامه‌های خارجی</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              هر سرویس بخش و ذخیرهٔ جداگانه دارد؛ تنظیمات تلگرام با اسلک یا دیسکورد مخلوط نمی‌شود.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {WEBHOOK_PROVIDER_ORDER.map((provider) => {
              const count = webhooksByProvider[provider].length;
              const active = webhooksByProvider[provider].filter((w) => w.isActive).length;
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setActiveProvider(provider)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-start text-sm transition-colors',
                    activeProvider === provider
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <span className="font-medium">{WEBHOOK_PROVIDER_LABELS[provider]}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {count === 0
                      ? 'بدون اتصال'
                      : `${formatNumber(active)} فعال از ${formatNumber(count)}`}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4 rounded-xl border border-border/80 p-4">
            <div>
              <h4 className="font-semibold">{WEBHOOK_PROVIDER_LABELS[activeProvider]}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{WEBHOOK_PROVIDER_HINTS[activeProvider]}</p>
            </div>

            {(activeState.error || activeState.message) && (
              <StatusBanner
                type={activeState.error ? 'error' : 'success'}
                message={activeState.error ?? activeState.message!}
                onDismiss={
                  activeState.error
                    ? undefined
                    : () => patchProvider(activeProvider, { message: null })
                }
              />
            )}

            <div className="space-y-3">
              {activeList.length === 0 ? (
                <p className="text-sm text-muted-foreground">هنوز اتصالی برای این سرویس ذخیره نشده است.</p>
              ) : (
                activeList.map((webhook) => (
                  <div key={webhook.id} className="rounded-xl border border-border/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{webhook.name}</p>
                          <Badge variant={webhook.isActive ? 'default' : 'outline'}>
                            {webhook.isActive ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
                          {webhook.url}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          رویدادها:{' '}
                          {webhook.events
                            .map(
                              (event) =>
                                WEBHOOK_EVENT_OPTIONS.find((option) => option.value === event)?.label ??
                                event,
                            )
                            .join('، ') || '—'}
                        </p>
                      </div>
                      {canEdit && (
                        <div className="flex flex-wrap gap-2">
                          <LoadingButton
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            loading={testingWebhookKey === webhook.id}
                            loadingText="در حال تست..."
                            disabled={Boolean(testingWebhookKey && testingWebhookKey !== webhook.id)}
                            onClick={() =>
                              void runWebhookTest({
                                key: webhook.id,
                                url: webhook.url,
                                provider: webhook.provider,
                                secret: webhook.secret ?? undefined,
                                webhookId: webhook.id,
                              })
                            }
                          >
                            تست اتصال
                          </LoadingButton>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => loadWebhook(webhook)}
                          >
                            ویرایش
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            disabled={isPending}
                            onClick={() => handleToggleWebhook(webhook)}
                          >
                            {webhook.isActive ? 'غیرفعال' : 'فعال'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-destructive"
                            onClick={() => setDeleteTarget(webhook)}
                          >
                            حذف
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {canEdit && (
              <div className="space-y-4 border-t border-border/60 pt-4">
                <h5 className="font-semibold">
                  {activeState.editingId
                    ? `ویرایش اتصال ${WEBHOOK_PROVIDER_LABELS[activeProvider]}`
                    : `افزودن اتصال ${WEBHOOK_PROVIDER_LABELS[activeProvider]}`}
                </h5>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`wh-name-${activeProvider}`}>نام اتصال</Label>
                    <Input
                      id={`wh-name-${activeProvider}`}
                      value={activeState.form.name}
                      onChange={(e) => patchForm(activeProvider, { name: e.target.value })}
                      className="mt-2 rounded-xl"
                      disabled={isPending}
                      placeholder={`مثلاً کانال ${WEBHOOK_PROVIDER_LABELS[activeProvider]} تحریریه`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`wh-secret-${activeProvider}`}>
                      {WEBHOOK_SECRET_LABELS[activeProvider]}
                    </Label>
                    <Input
                      id={`wh-secret-${activeProvider}`}
                      dir="ltr"
                      value={activeState.form.secret}
                      onChange={(e) => patchForm(activeProvider, { secret: e.target.value })}
                      className="mt-2 rounded-xl"
                      disabled={isPending}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor={`wh-url-${activeProvider}`}>URL</Label>
                    <Input
                      id={`wh-url-${activeProvider}`}
                      dir="ltr"
                      value={activeState.form.url}
                      onChange={(e) => patchForm(activeProvider, { url: e.target.value })}
                      placeholder={WEBHOOK_URL_PLACEHOLDERS[activeProvider]}
                      className="mt-2 rounded-xl"
                      disabled={isPending}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>رویدادها</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {WEBHOOK_EVENT_OPTIONS.map((event) => {
                        const selected = activeState.form.events.includes(event.value);
                        return (
                          <button
                            key={event.value}
                            type="button"
                            disabled={isPending}
                            onClick={() => toggleEvent(activeProvider, event.value)}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                              selected
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border text-muted-foreground hover:border-primary/40',
                            )}
                          >
                            {event.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <LoadingButton
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    loading={testingWebhookKey === `form-${activeProvider}`}
                    loadingText="در حال تست..."
                    disabled={Boolean(
                      testingWebhookKey && testingWebhookKey !== `form-${activeProvider}`,
                    )}
                    onClick={() => {
                      if (!activeState.form.url.trim()) {
                        patchProvider(activeProvider, {
                          error: 'URL الزامی است.',
                          message: null,
                        });
                        return;
                      }
                      void runWebhookTest({
                        key: `form-${activeProvider}`,
                        url: activeState.form.url.trim(),
                        provider: activeProvider,
                        secret: activeState.form.secret.trim() || undefined,
                      });
                    }}
                  >
                    تست اتصال
                  </LoadingButton>
                  {(activeState.editingId || activeState.form.name || activeState.form.url) && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => resetProviderForm(activeProvider)}
                    >
                      انصراف
                    </Button>
                  )}
                  <LoadingButton
                    type="button"
                    className="rounded-xl px-6"
                    loading={isPending}
                    loadingText="در حال ذخیره..."
                    onClick={() => saveWebhook(activeProvider)}
                  >
                    {activeState.editingId
                      ? 'ذخیره تغییرات این بخش'
                      : `ذخیره اتصال ${WEBHOOK_PROVIDER_LABELS[activeProvider]}`}
                  </LoadingButton>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">آخرین اعلان‌ها</h3>
              <p className="mt-1 text-sm text-muted-foreground">لاگ ارسال ایمیل، پیامک و Webhook</p>
            </div>
            <select
              value={notificationFilter}
              onChange={(e) => setNotificationFilter(e.target.value as NotificationStatus | 'ALL')}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">همه وضعیت‌ها</option>
              {(Object.values(NotificationStatus) as NotificationStatus[]).map((status) => (
                <option key={status} value={status}>
                  {NOTIFICATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {filteredNotifications.length === 0 && (
              <p className="text-sm text-muted-foreground">اعلانی یافت نشد.</p>
            )}
            {filteredNotifications.map((n) => (
              <div key={n.id} className="rounded-xl border border-border/60 px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{CHANNEL_LABELS[n.channel]}</Badge>
                  <Badge variant={NOTIFICATION_STATUS_VARIANT[n.status]}>
                    {NOTIFICATION_STATUS_LABELS[n.status]}
                  </Badge>
                  <span className="font-mono text-xs" dir="ltr">
                    {n.recipient}
                  </span>
                  <span className="ms-auto text-xs text-muted-foreground">
                    {formatJalali(n.createdAt, true)}
                  </span>
                </div>
                {n.subject && <p className="mt-1 font-medium">{n.subject}</p>}
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                {n.errorMessage && <p className="mt-1 text-xs text-destructive">{n.errorMessage}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف اتصال Webhook"
        description={`آیا از حذف «${deleteTarget?.name}» مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isPending}
        onConfirm={handleDeleteWebhook}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
