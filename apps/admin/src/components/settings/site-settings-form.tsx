'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { SiteConfig } from '@vargah/business/site-settings';
import { resolveContactMapView } from '@vargah/business/site-settings';
import { Button } from '@vargah/ui/components/button';
import { Input, Label, Textarea } from '@vargah/ui/components/input';

import {
  testDatabaseConnection,
  updateSiteBranding,
  updateSiteContact,
  updateSiteFooter,
  updateSiteNewsletter,
} from '@/actions/settings';
import { adminApiPath } from '@/lib/base-path';
import { csrfHeaders } from '@/lib/csrf-client';
import { isNextRedirect } from '@/lib/action-state';
import { resolveBrandingAssetSrc } from '@/lib/branding-assets';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { LoginBrandingPreview } from '@/components/settings/login-branding-preview';
import { getActionErrorMessage } from '@/lib/settings/errors';
import { SettingsAccordionSection } from '@/components/settings/settings-accordion-section';
import type { DatabaseConnectionInfo } from '@/lib/database-info';
import {
  validateSiteBranding,
  validateSiteContact,
  validateSiteFooter,
  validateSiteNewsletter,
} from '@/lib/settings/validation';

type SiteSettingsFormProps = {
  initialConfig: SiteConfig;
  canEdit: boolean;
  databaseInfo: DatabaseConnectionInfo;
};

type UploadField =
  'siteLogo' | 'favicon' | 'adminLogo' | 'loginLogo' | 'loginBackground' | 'heroBanner';

const UPLOAD_META: Record<UploadField, { label: string; target: 'web' | 'admin'; hint: string }> = {
  siteLogo: { label: 'لوگوی سایت', target: 'web', hint: 'نمایش در هدر سایت اصلی' },
  favicon: {
    label: 'آیکن مرورگر (Favicon)',
    target: 'web',
    hint: 'آیکن تب مرورگر در سایت و پنل ادمین',
  },
  adminLogo: { label: 'لوگوی پنل ادمین', target: 'admin', hint: 'نمایش در سایدبار پنل' },
  loginLogo: { label: 'لوگوی صفحه ورود', target: 'admin', hint: 'نمایش در صفحه لاگین پنل' },
  loginBackground: {
    label: 'تصویر پس‌زمینه ورود',
    target: 'admin',
    hint: 'پس‌زمینه بخش چپ صفحه لاگین',
  },
  heroBanner: { label: 'بنر بالای صفحه اصلی', target: 'web', hint: 'تصویر پس‌زمینه Hero' },
};

const WEB_BRANDING_FIELDS: UploadField[] = ['siteLogo', 'favicon', 'heroBanner'];
const ADMIN_BRANDING_FIELDS: UploadField[] = ['adminLogo', 'loginLogo', 'loginBackground'];

function AssetPreview({ src, alt, target }: { src: string; alt: string; target: 'web' | 'admin' }) {
  const resolved = resolveBrandingAssetSrc(src, target) ?? src;

  return (
    <div className="border-border bg-muted/30 relative size-16 overflow-hidden rounded-xl border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolved} alt={alt} className="size-full object-cover" />
    </div>
  );
}

function BrandingUploadCard({
  field,
  config,
  canEdit,
  isSavingBranding,
  uploadingField,
  fileRefs,
  onUpload,
  onPathChange,
}: {
  field: UploadField;
  config: SiteConfig;
  canEdit: boolean;
  isSavingBranding: boolean;
  uploadingField: UploadField | null;
  fileRefs: React.MutableRefObject<Partial<Record<UploadField, HTMLInputElement | null>>>;
  onUpload: (field: UploadField, file: File) => void;
  onPathChange: (field: UploadField, value: string) => void;
}) {
  return (
    <div className="border-border/80 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <AssetPreview
          src={config.branding[field]}
          alt={UPLOAD_META[field].label}
          target={UPLOAD_META[field].target}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{UPLOAD_META[field].label}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{UPLOAD_META[field].hint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={!canEdit || isSavingBranding || uploadingField === field}
              onClick={() => fileRefs.current[field]?.click()}
            >
              {uploadingField === field ? 'در حال آپلود...' : 'انتخاب فایل'}
            </Button>
            <Input
              value={config.branding[field]}
              onChange={(e) => onPathChange(field, e.target.value)}
              dir="ltr"
              className="h-9 rounded-lg text-xs"
              disabled={!canEdit || isSavingBranding}
            />
          </div>
        </div>
      </div>
      <input
        ref={(el) => {
          fileRefs.current[field] = el;
        }}
        type="file"
        accept="image/*,.ico"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(field, file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function SiteSettingsForm({ initialConfig, canEdit, databaseInfo }: SiteSettingsFormProps) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [dbStatusOk, setDbStatusOk] = useState<boolean | null>(null);
  const [brandingMessage, setBrandingMessage] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const [footerMessage, setFooterMessage] = useState<string | null>(null);
  const [footerError, setFooterError] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [isSavingBranding, startBrandingSave] = useTransition();
  const [isSavingFooter, startFooterSave] = useTransition();
  const [isSavingContact, startContactSave] = useTransition();
  const [isSavingNewsletter, startNewsletterSave] = useTransition();
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [uploadingField, setUploadingField] = useState<UploadField | null>(null);
  const fileRefs = useRef<Partial<Record<UploadField, HTMLInputElement | null>>>({});

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const updateBranding = (key: keyof SiteConfig['branding'], value: string) => {
    setConfig((prev) => ({ ...prev, branding: { ...prev.branding, [key]: value } }));
  };

  const updateFooter = (key: keyof SiteConfig['footer'], value: string) => {
    setConfig((prev) => ({ ...prev, footer: { ...prev.footer, [key]: value } }));
  };

  const updateContact = <K extends keyof SiteConfig['contact']>(
    key: K,
    value: SiteConfig['contact'][K],
  ) => {
    setConfig((prev) => ({ ...prev, contact: { ...prev.contact, [key]: value } }));
  };

  const updateNewsletter = <K extends keyof SiteConfig['newsletter']>(
    key: K,
    value: SiteConfig['newsletter'][K],
  ) => {
    setConfig((prev) => ({ ...prev, newsletter: { ...prev.newsletter, [key]: value } }));
  };

  const mapPreview = resolveContactMapView(config.contact);

  const handleTestDb = async () => {
    setIsTestingDb(true);
    setDbStatus(null);
    setDbStatusOk(null);
    const result = await testDatabaseConnection();
    setDbStatus(result.message);
    setDbStatusOk(result.ok);
    setIsTestingDb(false);
  };

  const handleUpload = async (field: UploadField, file: File) => {
    if (!canEdit) return;
    setBrandingError(null);
    setBrandingMessage(null);
    setUploadingField(field);

    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('field', field);
      formData.set('target', UPLOAD_META[field].target);

      const res = await fetch(adminApiPath('/api/settings/upload'), {
        method: 'POST',
        headers: csrfHeaders(),
        body: formData,
        credentials: 'include',
      });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        setBrandingError(data.error ?? 'آپلود ناموفق بود');
        return;
      }

      updateBranding(field, data.path);
      setBrandingMessage(`${UPLOAD_META[field].label} آپلود و ذخیره شد.`);
      router.refresh();
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveBranding = () => {
    if (!canEdit) return;
    const validationError = validateSiteBranding(config.branding);
    if (validationError) {
      setBrandingError(validationError);
      setBrandingMessage(null);
      return;
    }
    setBrandingError(null);
    setBrandingMessage(null);

    startBrandingSave(async () => {
      try {
        await updateSiteBranding(config.branding);
        setBrandingMessage('هویت بصری با موفقیت ذخیره شد.');
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setBrandingError(getActionErrorMessage(err, 'ذخیره هویت بصری ناموفق بود.'));
      }
    });
  };

  const handleSaveFooter = () => {
    if (!canEdit) return;
    const validationError = validateSiteFooter(config.footer);
    if (validationError) {
      setFooterError(validationError);
      setFooterMessage(null);
      return;
    }
    setFooterError(null);
    setFooterMessage(null);

    startFooterSave(async () => {
      try {
        await updateSiteFooter(config.footer);
        setFooterMessage('تنظیمات فوتر با موفقیت ذخیره شد.');
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setFooterError(getActionErrorMessage(err, 'ذخیره فوتر ناموفق بود.'));
      }
    });
  };

  const handleSaveContact = () => {
    if (!canEdit) return;
    const validationError = validateSiteContact(config.contact);
    if (validationError) {
      setContactError(validationError);
      setContactMessage(null);
      return;
    }
    setContactError(null);
    setContactMessage(null);

    startContactSave(async () => {
      try {
        await updateSiteContact(config.contact);
        setContactMessage('تنظیمات صفحه تماس با ما ذخیره شد.');
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setContactError(getActionErrorMessage(err, 'ذخیره تنظیمات تماس ناموفق بود.'));
      }
    });
  };

  const handleSaveNewsletter = () => {
    if (!canEdit) return;
    const validationError = validateSiteNewsletter(config.newsletter);
    if (validationError) {
      setNewsletterError(validationError);
      setNewsletterMessage(null);
      return;
    }
    setNewsletterError(null);
    setNewsletterMessage(null);

    startNewsletterSave(async () => {
      try {
        await updateSiteNewsletter(config.newsletter);
        setNewsletterMessage('متن بخش خبرنامه صفحه اصلی ذخیره شد.');
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setNewsletterError(getActionErrorMessage(err, 'ذخیره خبرنامه ناموفق بود.'));
      }
    });
  };

  return (
    <div className="space-y-4">
      <SettingsAccordionSection
        title="اتصال دیتابیس"
        description="بررسی سلامت اتصال PostgreSQL"
        defaultOpen={false}
      >
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="border-border/60 bg-muted/20 rounded-xl border px-3 py-2">
            <dt className="text-muted-foreground">نام دیتابیس</dt>
            <dd className="mt-1 font-mono text-xs" dir="ltr">
              {databaseInfo.databaseName ?? '—'}
            </dd>
          </div>
          <div className="border-border/60 bg-muted/20 rounded-xl border px-3 py-2">
            <dt className="text-muted-foreground">میزبان</dt>
            <dd className="mt-1 font-mono text-xs" dir="ltr">
              {databaseInfo.host
                ? `${databaseInfo.host}${databaseInfo.port ? `:${databaseInfo.port}` : ''}`
                : '—'}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <LoadingButton
            type="button"
            variant="outline"
            className="rounded-xl"
            loading={isTestingDb}
            loadingText="در حال تست..."
            onClick={handleTestDb}
          >
            تست اتصال دیتابیس
          </LoadingButton>
          {dbStatus && (
            <StatusBanner
              type={dbStatusOk ? 'success' : 'error'}
              message={dbStatus}
              className="flex-1"
              onDismiss={dbStatusOk ? () => setDbStatus(null) : undefined}
            />
          )}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="هویت بصری سایت"
        description="لوگوها پس از آپلود بلافاصله ذخیره می‌شوند."
        defaultOpen
        canEdit={canEdit}
        saving={isSavingBranding}
        onSave={handleSaveBranding}
        saveLabel="ذخیره هویت بصری"
        feedback={
          brandingError || brandingMessage
            ? {
                type: brandingError ? 'error' : 'success',
                message: brandingError ?? brandingMessage!,
              }
            : null
        }
        onDismissFeedback={() => setBrandingMessage(null)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="siteName" required>
              نام سایت
            </Label>
            <Input
              id="siteName"
              value={config.branding.siteName}
              onChange={(e) => updateBranding('siteName', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingBranding}
            />
          </div>
          <div>
            <Label htmlFor="siteTagline">زیرعنوان / شعار</Label>
            <Input
              id="siteTagline"
              value={config.branding.siteTagline}
              onChange={(e) => updateBranding('siteTagline', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingBranding}
            />
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <h3 className="text-base font-semibold">پنل مدیریت</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              لوگو و پس‌زمینه صفحه ورود و سایدبار پنل ادمین
            </p>
          </div>

          <LoginBrandingPreview
            siteName={config.branding.siteName}
            siteTagline={config.branding.siteTagline}
            loginLogo={config.branding.loginLogo}
            loginBackground={config.branding.loginBackground}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            {ADMIN_BRANDING_FIELDS.map((field) => (
              <BrandingUploadCard
                key={field}
                field={field}
                config={config}
                canEdit={canEdit}
                isSavingBranding={isSavingBranding}
                uploadingField={uploadingField}
                fileRefs={fileRefs}
                onUpload={handleUpload}
                onPathChange={(f, value) => updateBranding(f, value)}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <h3 className="text-base font-semibold">سایت عمومی</h3>
            <p className="text-muted-foreground mt-1 text-sm">لوگو، favicon و بنر صفحه اصلی سایت</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {WEB_BRANDING_FIELDS.map((field) => (
              <BrandingUploadCard
                key={field}
                field={field}
                config={config}
                canEdit={canEdit}
                isSavingBranding={isSavingBranding}
                uploadingField={uploadingField}
                fileRefs={fileRefs}
                onUpload={handleUpload}
                onPathChange={(f, value) => updateBranding(f, value)}
              />
            ))}
          </div>
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="تنظیمات فوتر"
        canEdit={canEdit}
        saving={isSavingFooter}
        onSave={handleSaveFooter}
        saveLabel="ذخیره فوتر"
        feedback={
          footerError || footerMessage
            ? { type: footerError ? 'error' : 'success', message: footerError ?? footerMessage! }
            : null
        }
        onDismissFeedback={() => setFooterMessage(null)}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="footerDescription">توضیح فوتر</Label>
            <Textarea
              id="footerDescription"
              rows={3}
              value={config.footer.description}
              onChange={(e) => updateFooter('description', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingFooter}
            />
          </div>
          <div>
            <Label htmlFor="footerCopyright">متن کپی‌رایت</Label>
            <Input
              id="footerCopyright"
              value={config.footer.copyright}
              onChange={(e) => updateFooter('copyright', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingFooter}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="footerEmail">ایمیل</Label>
              <Input
                id="footerEmail"
                dir="ltr"
                value={config.footer.email}
                onChange={(e) => updateFooter('email', e.target.value)}
                className="mt-2 rounded-xl"
                disabled={!canEdit || isSavingFooter}
              />
            </div>
            <div>
              <Label htmlFor="footerPhone">تلفن</Label>
              <Input
                id="footerPhone"
                dir="ltr"
                value={config.footer.phone}
                onChange={(e) => updateFooter('phone', e.target.value)}
                className="mt-2 rounded-xl"
                disabled={!canEdit || isSavingFooter}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="footerAddress">آدرس</Label>
            <Textarea
              id="footerAddress"
              rows={2}
              value={config.footer.address}
              onChange={(e) => updateFooter('address', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingFooter}
            />
          </div>
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="صفحه تماس با ما"
        description="متن صفحه، آدرس دفتر، شبکه‌های اجتماعی و نقشه تعاملی (OSM / نشان / بلد)"
        canEdit={canEdit}
        saving={isSavingContact}
        onSave={handleSaveContact}
        saveLabel="ذخیره تماس با ما"
        feedback={
          contactError || contactMessage
            ? { type: contactError ? 'error' : 'success', message: contactError ?? contactMessage! }
            : null
        }
        onDismissFeedback={() => setContactMessage(null)}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="contactAddress">آدرس دفتر</Label>
            <Textarea
              id="contactAddress"
              rows={3}
              value={config.contact.address}
              onChange={(e) => updateContact('address', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingContact}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contactPhone">تلفن</Label>
              <Input
                id="contactPhone"
                dir="ltr"
                value={config.contact.phone}
                onChange={(e) => updateContact('phone', e.target.value)}
                className="mt-2 rounded-xl"
                disabled={!canEdit || isSavingContact}
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">ایمیل</Label>
              <Input
                id="contactEmail"
                dir="ltr"
                value={config.contact.email}
                onChange={(e) => updateContact('email', e.target.value)}
                className="mt-2 rounded-xl"
                disabled={!canEdit || isSavingContact}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contactWorkingHours">ساعات پاسخگویی</Label>
            <Input
              id="contactWorkingHours"
              value={config.contact.workingHours}
              onChange={(e) => updateContact('workingHours', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingContact}
            />
          </div>
          <div>
            <Label htmlFor="contactResponseNote">یادداشت پاسخ</Label>
            <Input
              id="contactResponseNote"
              value={config.contact.responseNote}
              onChange={(e) => updateContact('responseNote', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingContact}
            />
          </div>

          <div className="border-border/70 space-y-3 rounded-xl border p-4">
            <p className="text-sm font-semibold">متن صفحه تماس</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Eyebrow</Label>
                <Input
                  value={config.contact.pageEyebrow}
                  onChange={(e) => updateContact('pageEyebrow', e.target.value)}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingContact}
                />
              </div>
              <div>
                <Label>عنوان صفحه</Label>
                <Input
                  value={config.contact.pageTitle}
                  onChange={(e) => updateContact('pageTitle', e.target.value)}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingContact}
                />
              </div>
              <div className="md:col-span-2">
                <Label>توضیح هدر</Label>
                <Textarea
                  rows={2}
                  value={config.contact.pageDescription}
                  onChange={(e) => updateContact('pageDescription', e.target.value)}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingContact}
                />
              </div>
              <div>
                <Label>عنوان فرم</Label>
                <Input
                  value={config.contact.formTitle}
                  onChange={(e) => updateContact('formTitle', e.target.value)}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingContact}
                />
              </div>
              <div>
                <Label>زیرعنوان فرم</Label>
                <Input
                  value={config.contact.formSubtitle}
                  onChange={(e) => updateContact('formSubtitle', e.target.value)}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingContact}
                />
              </div>
              <div>
                <Label>عنوان اطلاعات</Label>
                <Input
                  value={config.contact.infoTitle}
                  onChange={(e) => updateContact('infoTitle', e.target.value)}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingContact}
                />
              </div>
              <div>
                <Label>عنوان شبکه‌ها</Label>
                <Input
                  value={config.contact.socialTitle}
                  onChange={(e) => updateContact('socialTitle', e.target.value)}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingContact}
                />
              </div>
              <div className="md:col-span-2">
                <Label>عنوان نقشه</Label>
                <Input
                  value={config.contact.mapTitle}
                  onChange={(e) => updateContact('mapTitle', e.target.value)}
                  className="mt-2 rounded-xl"
                  disabled={!canEdit || isSavingContact}
                />
              </div>
            </div>
          </div>

          <div className="border-border/70 space-y-3 rounded-xl border p-4">
            <p className="text-sm font-semibold">شبکه‌های اجتماعی</p>
            <p className="text-muted-foreground text-xs">
              در صفحه تماس و فوتر سایت نمایش داده می‌شود
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  ['instagram', 'اینستاگرام'],
                  ['telegram', 'تلگرام'],
                  ['whatsapp', 'واتساپ'],
                  ['twitter', 'ایکس / توییتر'],
                  ['eitaa', 'ایتا'],
                  ['linkedin', 'لینکدین'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={`social-${key}`}>{label}</Label>
                  <Input
                    id={`social-${key}`}
                    dir="ltr"
                    value={config.contact.social[key]}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        contact: {
                          ...prev.contact,
                          social: { ...prev.contact.social, [key]: e.target.value },
                        },
                      }))
                    }
                    className="mt-2 rounded-xl"
                    disabled={!canEdit || isSavingContact}
                    placeholder="https://"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mapLat">عرض جغرافیایی</Label>
              <Input
                id="mapLat"
                type="number"
                step="any"
                dir="ltr"
                value={config.contact.mapLat}
                onChange={(e) => updateContact('mapLat', Number(e.target.value))}
                className="mt-2 rounded-xl"
                disabled={!canEdit || isSavingContact}
              />
            </div>
            <div>
              <Label htmlFor="mapLng">طول جغرافیایی</Label>
              <Input
                id="mapLng"
                type="number"
                step="any"
                dir="ltr"
                value={config.contact.mapLng}
                onChange={(e) => updateContact('mapLng', Number(e.target.value))}
                className="mt-2 rounded-xl"
                disabled={!canEdit || isSavingContact}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="mapEmbedUrl">کد embed نقشه (اختیاری)</Label>
            <Textarea
              id="mapEmbedUrl"
              rows={3}
              dir="ltr"
              value={config.contact.mapEmbedUrl}
              onChange={(e) => updateContact('mapEmbedUrl', e.target.value)}
              placeholder="https://www.openstreetmap.org/export/embed.html?... یا embed نشان/بلد/گوگل"
              className="mt-2 rounded-xl font-mono text-xs"
              disabled={!canEdit || isSavingContact}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              اگر خالی باشد، نقشه تعاملی Leaflet از مختصات بالا ساخته می‌شود. در غیر این صورت embed
              (OpenStreetMap، نشان، بلد یا گوگل) نمایش داده می‌شود.
            </p>
          </div>
          {mapPreview?.mode === 'embed' && (
            <div className="border-border overflow-hidden rounded-xl border">
              <p className="border-border bg-muted/30 text-muted-foreground border-b px-4 py-2 text-xs">
                پیش‌نمایش embed
              </p>
              <iframe
                title="پیش‌نمایش نقشه"
                src={mapPreview.src}
                className="h-56 w-full border-0"
                loading="lazy"
              />
            </div>
          )}
          {mapPreview?.mode === 'coordinates' && (
            <p className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
              نقشه تعاملی (Leaflet + Carto/OSM) با مختصات {mapPreview.lat.toFixed(4)}،{' '}
              {mapPreview.lng.toFixed(4)} در سایت نمایش داده می‌شود؛ لینک‌های نشان و بلد نیز اضافه
              می‌شوند.
            </p>
          )}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="خبرنامه صفحه اصلی"
        description="متن بخش عضویت در خبرنامه در پایین صفحه اصلی سایت"
        canEdit={canEdit}
        saving={isSavingNewsletter}
        onSave={handleSaveNewsletter}
        saveLabel="ذخیره خبرنامه"
        feedback={
          newsletterError || newsletterMessage
            ? {
                type: newsletterError ? 'error' : 'success',
                message: newsletterError ?? newsletterMessage!,
              }
            : null
        }
        onDismissFeedback={() => setNewsletterMessage(null)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="newsletterEyebrow">Eyebrow</Label>
            <Input
              id="newsletterEyebrow"
              value={config.newsletter.eyebrow}
              onChange={(e) => updateNewsletter('eyebrow', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingNewsletter}
            />
          </div>
          <div>
            <Label htmlFor="newsletterTitle" required>
              عنوان
            </Label>
            <Input
              id="newsletterTitle"
              value={config.newsletter.title}
              onChange={(e) => updateNewsletter('title', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingNewsletter}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="newsletterDescription">توضیح</Label>
            <Textarea
              id="newsletterDescription"
              rows={3}
              value={config.newsletter.description}
              onChange={(e) => updateNewsletter('description', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingNewsletter}
            />
          </div>
          <div>
            <Label htmlFor="newsletterEmailLabel">برچسب ایمیل</Label>
            <Input
              id="newsletterEmailLabel"
              value={config.newsletter.emailLabel}
              onChange={(e) => updateNewsletter('emailLabel', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingNewsletter}
            />
          </div>
          <div>
            <Label htmlFor="newsletterPlaceholder">Placeholder</Label>
            <Input
              id="newsletterPlaceholder"
              dir="ltr"
              value={config.newsletter.placeholder}
              onChange={(e) => updateNewsletter('placeholder', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingNewsletter}
            />
          </div>
          <div>
            <Label htmlFor="newsletterCta" required>
              متن دکمه
            </Label>
            <Input
              id="newsletterCta"
              value={config.newsletter.ctaLabel}
              onChange={(e) => updateNewsletter('ctaLabel', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingNewsletter}
            />
          </div>
          <div>
            <Label htmlFor="newsletterSuccess">پیام موفقیت</Label>
            <Input
              id="newsletterSuccess"
              value={config.newsletter.successMessage}
              onChange={(e) => updateNewsletter('successMessage', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingNewsletter}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="newsletterPrivacy">یادداشت حریم خصوصی</Label>
            <Input
              id="newsletterPrivacy"
              value={config.newsletter.privacyNote}
              onChange={(e) => updateNewsletter('privacyNote', e.target.value)}
              className="mt-2 rounded-xl"
              disabled={!canEdit || isSavingNewsletter}
            />
          </div>
        </div>
      </SettingsAccordionSection>
    </div>
  );
}
