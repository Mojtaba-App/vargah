'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_PAYMENT_CONFIG,
  PAYMENT_PROVIDER_LABELS,
  getPaymentCallbackUrl,
  isPaymentReady,
  resolvePaymentConfig,
  type PaymentConfig,
} from '@vargah/business/payment-config';
import { Input, Label } from '@vargah/ui/components/input';
import { Badge } from '@vargah/ui/components/badge';

import { updatePaymentConfig, testPaymentSettings } from '@/actions/settings';
import { isNextRedirect } from '@/lib/action-state';
import { SETTINGS_SECRET_PLACEHOLDER } from '@/lib/settings-secrets';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { getActionErrorMessage, formatPaymentFeedbackMessage } from '@/lib/settings/errors';
import { cn } from '@/lib/utils';

type PaymentSettingsFormProps = {
  initialConfig: PaymentConfig;
  canEdit: boolean;
};

export function PaymentSettingsForm({ initialConfig, canEdit }: PaymentSettingsFormProps) {
  const router = useRouter();
  const hasStoredMerchant = Boolean(initialConfig.zarinpal.merchantId);
  const maskedMerchant = hasStoredMerchant ? SETTINGS_SECRET_PLACEHOLDER : '';

  const [config, setConfig] = useState<PaymentConfig>({
    ...initialConfig,
    zarinpal: {
      ...initialConfig.zarinpal,
      merchantId: maskedMerchant,
    },
  });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setConfig({
      ...initialConfig,
      zarinpal: {
        ...initialConfig.zarinpal,
        merchantId: maskedMerchant,
      },
    });
  }, [initialConfig, maskedMerchant]);

  const previewConfig = resolvePaymentConfig({
    ...config,
    zarinpal: {
      ...config.zarinpal,
      // فقط برای پیش‌نمایش آماده‌بودن — مقدار واقعی روی سرور merge می‌شود
      merchantId:
        config.zarinpal.merchantId === SETTINGS_SECRET_PLACEHOLDER || !config.zarinpal.merchantId
          ? hasStoredMerchant
            ? 'configured'
            : ''
          : config.zarinpal.merchantId,
    },
  });
  const ready = isPaymentReady(previewConfig);
  const callbackUrl = ready ? getPaymentCallbackUrl(previewConfig) : '';

  const buildPayload = (): PaymentConfig => ({
    ...config,
    provider: 'zarinpal',
    zarinpal: {
      ...config.zarinpal,
      merchantId:
        !config.zarinpal.merchantId || config.zarinpal.merchantId === SETTINGS_SECRET_PLACEHOLDER
          ? SETTINGS_SECRET_PLACEHOLDER
          : config.zarinpal.merchantId,
    },
  });

  const handleTest = async () => {
    setStatus(null);
    setError(null);
    setIsTesting(true);
    const result = await testPaymentSettings(buildPayload());
    if (result.ok) setStatus(result.message);
    else setError(formatPaymentFeedbackMessage(result.message));
    setIsTesting(false);
  };

  const handleSave = () => {
    setStatus(null);
    setError(null);
    startSave(async () => {
      try {
        await updatePaymentConfig(buildPayload());
        setStatus('تنظیمات درگاه ذخیره شد');
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setError(getActionErrorMessage(err));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={ready ? 'default' : 'outline'}>
          {ready ? 'آماده پرداخت آنلاین' : 'نیاز به تکمیل تنظیمات'}
        </Badge>
        <Badge variant="secondary">{PAYMENT_PROVIDER_LABELS.zarinpal}</Badge>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {(status || error) && (
          <StatusBanner
            type={error ? 'error' : 'success'}
            message={error ?? status!}
            className="mb-4"
            onDismiss={error ? undefined : () => setStatus(null)}
          />
        )}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">درگاه زرین‌پال</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Merchant ID و آدرس callback برای پرداخت اشتراک در سایت
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.enabled}
              disabled={!canEdit}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="size-4 rounded border-border"
            />
            فعال
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="merchant-id">Merchant ID</Label>
            <Input
              id="merchant-id"
              value={config.zarinpal.merchantId}
              disabled={!canEdit}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  zarinpal: { ...prev.zarinpal, merchantId: e.target.value },
                }))
              }
              className="rounded-xl font-mono text-sm"
              dir="ltr"
            />
            {hasStoredMerchant && (
              <p className="text-xs text-muted-foreground">
                Merchant ID ذخیره شده — برای تغییر مقدار جدید وارد کنید
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="callback-base">آدرس پایه سایت (Callback)</Label>
            <Input
              id="callback-base"
              value={config.callbackBaseUrl}
              disabled={!canEdit}
              placeholder="http://localhost:3000"
              onChange={(e) => setConfig((prev) => ({ ...prev, callbackBaseUrl: e.target.value }))}
              className="rounded-xl font-mono text-sm"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              اگر خالی بماند، از NEXT_PUBLIC_SITE_URL یا در dev از localhost:3000 استفاده می‌شود.
            </p>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={config.zarinpal.sandbox}
              disabled={!canEdit}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  zarinpal: { ...prev.zarinpal, sandbox: e.target.checked },
                }))
              }
              className="size-4 rounded border-border"
            />
            حالت Sandbox (تست)
          </label>
        </div>

        {callbackUrl && (
          <div className="mt-4 rounded-xl bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium">آدرس Callback</p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground" dir="ltr">
              {callbackUrl}
            </p>
          </div>
        )}

        {canEdit && (
          <div className="mt-6 flex flex-wrap gap-3">
            <LoadingButton
              type="button"
              variant="outline"
              className="rounded-xl"
              loading={isTesting}
              loadingText="در حال تست..."
              onClick={handleTest}
            >
              تست اتصال
            </LoadingButton>
            <LoadingButton loading={isSaving} onClick={handleSave} className="rounded-xl">
              ذخیره تنظیمات درگاه
            </LoadingButton>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        <p>
          پس از فعال‌سازی، صفحه{' '}
          <span className={cn('font-medium text-foreground')}>/subscription</span> به‌صورت خودکار
          پلن‌های فعال را نمایش می‌دهد و پرداخت از طریق زرین‌پال انجام می‌شود.
        </p>
      </div>
    </div>
  );
}

export { DEFAULT_PAYMENT_CONFIG };
