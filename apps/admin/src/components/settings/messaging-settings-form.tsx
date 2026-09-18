'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_MESSAGING_CONFIG,
  SMS_PROVIDER_LABELS,
  type EmailConfig,
  type MessagingConfig,
  type SmsConfig,
  type SmsProvider,
} from '@vargah/business/messaging-config';
import { Input, Label } from '@vargah/ui/components/input';

import {
  sendTestEmail,
  sendTestSms,
  testEmailSettings,
  testSmsSettings,
  updateEmailConfig,
  updateSmsConfig,
} from '@/actions/settings';
import { isNextRedirect } from '@/lib/action-state';
import { SETTINGS_SECRET_PLACEHOLDER } from '@/lib/settings-secrets';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { getActionErrorMessage } from '@/lib/settings/errors';
import { SettingsAccordionSection } from '@/components/settings/settings-accordion-section';
import { TemplatesManager, type MessageTemplateRow } from '@/components/settings/templates-manager';
import { NotificationChannel } from '@/lib/communications/enums';

type MessagingSettingsFormProps = {
  initialConfig: MessagingConfig;
  templates: MessageTemplateRow[];
  canEdit: boolean;
};

export function MessagingSettingsForm({
  initialConfig,
  templates,
  canEdit,
}: MessagingSettingsFormProps) {
  const router = useRouter();
  const hasStoredEmailPassword = Boolean(initialConfig.email.password);
  const hasStoredSmsApiKey = Boolean(initialConfig.sms.apiKey);
  const hasStoredSmsPassword = Boolean(initialConfig.sms.password);
  const maskedEmailPassword = hasStoredEmailPassword ? SETTINGS_SECRET_PLACEHOLDER : '';
  const maskedSmsApiKey = hasStoredSmsApiKey ? SETTINGS_SECRET_PLACEHOLDER : '';
  const maskedSmsPassword = hasStoredSmsPassword ? SETTINGS_SECRET_PLACEHOLDER : '';
  const hasStoredSmsSecrets = hasStoredSmsApiKey || hasStoredSmsPassword;

  const prepareEmailForSave = (value: EmailConfig): EmailConfig => ({
    ...value,
    password:
      !value.password || value.password === maskedEmailPassword
        ? SETTINGS_SECRET_PLACEHOLDER
        : value.password,
  });

  const prepareSmsForSave = (value: SmsConfig): SmsConfig => ({
    ...value,
    apiKey:
      !value.apiKey || value.apiKey === maskedSmsApiKey
        ? SETTINGS_SECRET_PLACEHOLDER
        : value.apiKey,
    password:
      !value.password || value.password === maskedSmsPassword
        ? SETTINGS_SECRET_PLACEHOLDER
        : value.password,
  });

  const [email, setEmail] = useState<EmailConfig>({
    ...initialConfig.email,
    password: maskedEmailPassword,
  });
  const [sms, setSms] = useState<SmsConfig>({
    ...initialConfig.sms,
    apiKey: maskedSmsApiKey,
    password: maskedSmsPassword,
  });

  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testSmsTo, setTestSmsTo] = useState('');

  const [isSavingEmail, startEmailSave] = useTransition();
  const [isSavingSms, startSmsSave] = useTransition();
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);

  useEffect(() => {
    setEmail({
      ...initialConfig.email,
      password: maskedEmailPassword,
    });
    setSms({
      ...initialConfig.sms,
      apiKey: maskedSmsApiKey,
      password: maskedSmsPassword,
    });
  }, [initialConfig, maskedEmailPassword, maskedSmsApiKey, maskedSmsPassword]);

  const updateEmail = <K extends keyof EmailConfig>(key: K, value: EmailConfig[K]) => {
    setEmail((prev) => ({ ...prev, [key]: value }));
  };

  const updateSms = <K extends keyof SmsConfig>(key: K, value: SmsConfig[K]) => {
    setSms((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEmail = () => {
    if (!canEdit) return;
    setEmailError(null);
    setEmailStatus(null);
    startEmailSave(async () => {
      try {
        await updateEmailConfig(prepareEmailForSave(email));
        setEmailStatus('تنظیمات ایمیل ذخیره شد.');
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setEmailError(getActionErrorMessage(err, 'ذخیره تنظیمات ایمیل ناموفق بود.'));
      }
    });
  };

  const handleSaveSms = () => {
    if (!canEdit) return;
    setSmsError(null);
    setSmsStatus(null);
    startSmsSave(async () => {
      try {
        await updateSmsConfig(prepareSmsForSave(sms));
        setSmsStatus('تنظیمات پیامک ذخیره شد.');
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setSmsError(getActionErrorMessage(err, 'ذخیره تنظیمات پیامک ناموفق بود.'));
      }
    });
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailError(null);
    setEmailStatus(null);
    const result = await testEmailSettings(prepareEmailForSave(email));
    if (result.ok) setEmailStatus(result.message);
    else setEmailError(result.message);
    setIsTestingEmail(false);
  };

  const handleTestSms = async () => {
    setIsTestingSms(true);
    setSmsError(null);
    setSmsStatus(null);
    const result = await testSmsSettings(prepareSmsForSave(sms));
    if (result.ok) setSmsStatus(result.message);
    else setSmsError(result.message);
    setIsTestingSms(false);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo) {
      setEmailError('آدرس ایمیل گیرنده را وارد کنید');
      return;
    }
    setIsSendingTestEmail(true);
    setEmailError(null);
    const result = await sendTestEmail(prepareEmailForSave(email), testEmailTo);
    if (result.ok) setEmailStatus(result.message);
    else setEmailError(result.message);
    setIsSendingTestEmail(false);
  };

  const handleSendTestSms = async () => {
    if (!testSmsTo) {
      setSmsError('شماره موبایل گیرنده را وارد کنید');
      return;
    }
    setIsSendingTestSms(true);
    setSmsError(null);
    const result = await sendTestSms(prepareSmsForSave(sms), testSmsTo);
    if (result.ok) setSmsStatus(result.message);
    else setSmsError(result.message);
    setIsSendingTestSms(false);
  };

  return (
    <div className="space-y-4">
      <SettingsAccordionSection
        title="تنظیمات ایمیل (SMTP)"
        description="پیکربندی سرور ایمیل برای ارسال اعلان‌ها"
        defaultOpen
        canEdit={canEdit}
        saving={isSavingEmail}
        onSave={handleSaveEmail}
        saveLabel="ذخیره ایمیل"
        headerExtra={
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={email.enabled}
              onChange={(e) => updateEmail('enabled', e.target.checked)}
              disabled={!canEdit}
            />
            فعال
          </label>
        }
        feedback={
          emailError || emailStatus
            ? { type: emailError ? 'error' : 'success', message: emailError ?? emailStatus! }
            : null
        }
        onDismissFeedback={() => setEmailStatus(null)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="smtpHost">سرور SMTP</Label>
            <Input
              id="smtpHost"
              dir="ltr"
              value={email.host}
              onChange={(e) => updateEmail('host', e.target.value)}
              placeholder="smtp.example.com"
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingEmail}
            />
          </div>
          <div>
            <Label htmlFor="smtpPort">پورت</Label>
            <Input
              id="smtpPort"
              type="number"
              dir="ltr"
              value={email.port}
              onChange={(e) =>
                updateEmail('port', Number(e.target.value) || DEFAULT_MESSAGING_CONFIG.email.port)
              }
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingEmail}
            />
          </div>
          <div>
            <Label htmlFor="smtpUser">نام کاربری</Label>
            <Input
              id="smtpUser"
              dir="ltr"
              value={email.user}
              onChange={(e) => updateEmail('user', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingEmail}
            />
          </div>
          <div>
            <Label htmlFor="smtpPassword">رمز عبور</Label>
            <Input
              id="smtpPassword"
              type="password"
              dir="ltr"
              value={email.password}
              onChange={(e) => updateEmail('password', e.target.value)}
              placeholder={hasStoredEmailPassword ? 'برای تغییر وارد کنید' : ''}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingEmail}
            />
          </div>
          <div>
            <Label htmlFor="fromName">نام فرستنده</Label>
            <Input
              id="fromName"
              value={email.fromName}
              onChange={(e) => updateEmail('fromName', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingEmail}
            />
          </div>
          <div>
            <Label htmlFor="fromEmail">ایمیل فرستنده</Label>
            <Input
              id="fromEmail"
              dir="ltr"
              value={email.fromEmail}
              onChange={(e) => updateEmail('fromEmail', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingEmail}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={email.secure}
            onChange={(e) => updateEmail('secure', e.target.checked)}
            disabled={!canEdit}
          />
          اتصال امن (SSL/TLS)
        </label>

        <div className="border-border/60 flex flex-wrap items-end gap-3 border-t pt-4">
          <Input
            dir="ltr"
            value={testEmailTo}
            onChange={(e) => setTestEmailTo(e.target.value)}
            placeholder="ایمیل آزمایشی"
            className="max-w-xs rounded-xl"
            disabled={!canEdit}
          />
          <LoadingButton
            type="button"
            variant="outline"
            className="rounded-xl"
            loading={isTestingEmail}
            loadingText="در حال تست..."
            onClick={handleTestEmail}
            disabled={!canEdit}
          >
            تست اتصال
          </LoadingButton>
          <LoadingButton
            type="button"
            variant="outline"
            className="rounded-xl"
            loading={isSendingTestEmail}
            loadingText="در حال ارسال..."
            onClick={handleSendTestEmail}
            disabled={!canEdit}
          >
            ارسال آزمایشی
          </LoadingButton>
        </div>

        <div className="border-border/60 border-t pt-6">
          <h3 className="text-base font-semibold">الگوهای ایمیل</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            متن اعلان‌های ایمیل با متغیرهای داینامیک
          </p>
          <div className="mt-4">
            <TemplatesManager
              templates={templates}
              canEdit={canEdit}
              channel={NotificationChannel.EMAIL}
            />
          </div>
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="تنظیمات پیامک"
        description="پشتیبانی از کاوه‌نگار، ملی‌پیامک و SMS.ir"
        canEdit={canEdit}
        saving={isSavingSms}
        onSave={handleSaveSms}
        saveLabel="ذخیره پیامک"
        headerExtra={
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sms.enabled}
              onChange={(e) => updateSms('enabled', e.target.checked)}
              disabled={!canEdit}
            />
            فعال
          </label>
        }
        feedback={
          smsError || smsStatus
            ? { type: smsError ? 'error' : 'success', message: smsError ?? smsStatus! }
            : null
        }
        onDismissFeedback={() => setSmsStatus(null)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="smsProvider">سرویس‌دهنده</Label>
            <select
              id="smsProvider"
              value={sms.provider}
              onChange={(e) => updateSms('provider', e.target.value as SmsProvider)}
              className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              disabled={!canEdit || isSavingSms}
            >
              {(Object.keys(SMS_PROVIDER_LABELS) as SmsProvider[]).map((provider) => (
                <option key={provider} value={provider}>
                  {SMS_PROVIDER_LABELS[provider]}
                </option>
              ))}
            </select>
          </div>

          {(sms.provider === 'kavenegar' || sms.provider === 'sms_ir') && (
            <div className="sm:col-span-2">
              <Label htmlFor="smsApiKey">API Key</Label>
              <Input
                id="smsApiKey"
                type="password"
                dir="ltr"
                value={sms.apiKey}
                onChange={(e) => updateSms('apiKey', e.target.value)}
                placeholder={hasStoredSmsSecrets ? 'برای تغییر وارد کنید' : ''}
                className="mt-2 rounded-xl"
                disabled={!canEdit || isSavingSms}
              />
            </div>
          )}

          {sms.provider === 'melipayamak' && (
            <>
              <div>
                <Label htmlFor="smsUsername">نام کاربری</Label>
                <Input
                  id="smsUsername"
                  dir="ltr"
                  value={sms.username}
                  onChange={(e) => updateSms('username', e.target.value)}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingSms}
                />
              </div>
              <div>
                <Label htmlFor="smsPassword">رمز عبور</Label>
                <Input
                  id="smsPassword"
                  type="password"
                  dir="ltr"
                  value={sms.password}
                  onChange={(e) => updateSms('password', e.target.value)}
                  placeholder={hasStoredSmsSecrets ? 'برای تغییر وارد کنید' : ''}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingSms}
                />
              </div>
            </>
          )}

          {sms.provider !== 'sms_ir' && (
            <div>
              <Label htmlFor="smsSender">شماره/خط ارسال</Label>
              <Input
                id="smsSender"
                dir="ltr"
                value={sms.sender}
                onChange={(e) => updateSms('sender', e.target.value)}
                className="mt-2 rounded-xl"
                disabled={!canEdit || isSavingSms}
              />
            </div>
          )}
        </div>

        <div className="border-border/60 flex flex-wrap items-end gap-3 border-t pt-4">
          <Input
            dir="ltr"
            value={testSmsTo}
            onChange={(e) => setTestSmsTo(e.target.value)}
            placeholder="09xxxxxxxxx"
            className="max-w-xs rounded-xl"
            disabled={!canEdit}
          />
          <LoadingButton
            type="button"
            variant="outline"
            className="rounded-xl"
            loading={isTestingSms}
            loadingText="در حال تست..."
            onClick={handleTestSms}
            disabled={!canEdit}
          >
            تست اتصال
          </LoadingButton>
          {sms.provider !== 'sms_ir' && (
            <LoadingButton
              type="button"
              variant="outline"
              className="rounded-xl"
              loading={isSendingTestSms}
              loadingText="در حال ارسال..."
              onClick={handleSendTestSms}
              disabled={!canEdit}
            >
              ارسال آزمایشی
            </LoadingButton>
          )}
        </div>

        <div className="border-border/60 border-t pt-6">
          <h3 className="text-base font-semibold">الگوهای پیامک</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {sms.provider === 'sms_ir'
              ? 'برای SMS.ir شناسه الگو را در هر الگو تنظیم کنید'
              : 'متن پیامک‌ها با متغیرهای داینامیک'}
          </p>
          <div className="mt-4">
            <TemplatesManager
              templates={templates}
              canEdit={canEdit}
              channel={NotificationChannel.SMS}
            />
          </div>
        </div>
      </SettingsAccordionSection>
    </div>
  );
}
