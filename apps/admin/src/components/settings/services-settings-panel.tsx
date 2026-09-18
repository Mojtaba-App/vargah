'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ServicesContent } from '@vargah/business/services-content';
import {
  AD_SURFACE_META,
  listSlotOptions,
  type AdSurfaceId,
} from '@vargah/business/services-content-types';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';

import { updateServicesContentSection, type ServicesContentSection } from '@/actions/settings';
import { isNextRedirect } from '@/lib/action-state';
import { SettingsAccordionSection } from '@/components/settings/settings-accordion-section';
import { ReasonConfirmDialog } from '@/components/ui/feedback/reason-confirm-dialog';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { JalaliDateField } from '@/components/ui/form/jalali-date-field';
import { getActionErrorMessage } from '@/lib/settings/errors';
import { adminApiPath, adminPath } from '@/lib/base-path';
import { csrfHeaders } from '@/lib/csrf-client';

type ServicesSettingsPanelProps = {
  initialContent: ServicesContent;
  canEdit: boolean;
};

type PendingDelete =
  | { kind: 'adPricing'; index: number }
  | { kind: 'adPlacement'; index: number }
  | { kind: 'adPortfolio'; index: number }
  | { kind: 'collaborationType'; index: number }
  | { kind: 'job'; index: number }
  | { kind: 'guideline'; index: number };

type SectionFeedback = {
  section: ServicesContentSection;
  type: 'success' | 'error';
  message: string;
};

const AD_PRICING_DELETE_REASONS = [
  'این تعرفه دیگر ارائه نمی‌شود',
  'قیمت یا مشخصات اشتباه ثبت شده',
  'جایگزینی با تعرفه جدید',
  'تکراری بودن مورد',
] as const;

const AD_PORTFOLIO_DELETE_REASONS = [
  'نمونه‌کار دیگر مرتبط نیست',
  'اطلاعات اشتباه ثبت شده',
  'جایگزینی با مورد جدید',
  'درخواست حذف از سوی مشتری',
] as const;

const AD_PLACEMENT_DELETE_REASONS = [
  'این جایگاه دیگر ارائه نمی‌شود',
  'اطلاعات اشتباه ثبت شده',
  'جایگزینی با جایگاه جدید',
  'تکراری بودن مورد',
] as const;

const TYPE_DELETE_REASONS = [
  'این نوع همکاری دیگر ارائه نمی‌شود',
  'عنوان اشتباه ثبت شده',
  'جایگزینی با مورد جدید',
  'تکراری بودن مورد',
] as const;

const JOB_DELETE_REASONS = [
  'فراخوان منقضی شده',
  'موقعیت پر شده است',
  'اطلاعات اشتباه ثبت شده',
  'جایگزینی با فراخوان جدید',
] as const;

const GUIDE_DELETE_REASONS = [
  'راهنما دیگر معتبر نیست',
  'متن اشتباه ثبت شده',
  'جایگزینی با راهنمای جدید',
  'تکراری بودن مورد',
] as const;

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function toDateOnly(isoOrDate: string): string {
  const trimmed = isoOrDate.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function ServicesSettingsPanel({ initialContent, canEdit }: ServicesSettingsPanelProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [feedback, setFeedback] = useState<SectionFeedback | null>(null);
  const [savingSection, setSavingSection] = useState<ServicesContentSection | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [uploadingPortfolioId, setUploadingPortfolioId] = useState<string | null>(null);
  const [, startSave] = useTransition();

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const dismissFeedback = () => setFeedback(null);

  const saveSection = (section: ServicesContentSection, label: string, payload: unknown) => {
    setFeedback(null);
    setSavingSection(section);
    startSave(async () => {
      try {
        await updateServicesContentSection(section, payload);
        setFeedback({ section, type: 'success', message: `${label} ذخیره شد` });
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setFeedback({ section, type: 'error', message: getActionErrorMessage(err) });
      } finally {
        setSavingSection(null);
      }
    });
  };

  const uploadPortfolioImage = async (index: number, file: File) => {
    const item = content.advertising.portfolio[index];
    if (!item) return;
    setUploadingPortfolioId(item.id);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.set('file', file);
      const res = await fetch(adminApiPath('/api/settings/ad-portfolio/upload'), {
        method: 'POST',
        headers: csrfHeaders(),
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        throw new Error(data.error || 'آپلود تصویر ناموفق بود');
      }
      setContent((prev) => ({
        ...prev,
        advertising: {
          ...prev.advertising,
          portfolio: prev.advertising.portfolio.map((row, i) =>
            i === index ? { ...row, image: data.path! } : row,
          ),
        },
      }));
      setFeedback({
        section: 'adPortfolio',
        type: 'success',
        message: 'تصویر آپلود شد — برای اعمال، «نمونه‌کارها» را ذخیره کنید',
      });
    } catch (err) {
      setFeedback({
        section: 'adPortfolio',
        type: 'error',
        message: getActionErrorMessage(err),
      });
    } finally {
      setUploadingPortfolioId(null);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { kind, index } = pendingDelete;
    setPendingDelete(null);

    if (kind === 'adPricing') {
      setContent((prev) => ({
        ...prev,
        advertising: {
          ...prev.advertising,
          pricing: prev.advertising.pricing.filter((_, i) => i !== index),
        },
      }));
      setFeedback({
        section: 'adPricing',
        type: 'success',
        message: 'تعرفه حذف شد — برای اعمال، «تعرفه‌های تبلیغاتی» را ذخیره کنید',
      });
      return;
    }

    if (kind === 'adPlacement') {
      setContent((prev) => ({
        ...prev,
        advertising: {
          ...prev.advertising,
          placements: prev.advertising.placements.filter((_, i) => i !== index),
        },
      }));
      setFeedback({
        section: 'adPlacements',
        type: 'success',
        message: 'جایگاه حذف شد — برای اعمال، «جایگاه‌های تبلیغاتی» را ذخیره کنید',
      });
      return;
    }

    if (kind === 'adPortfolio') {
      setContent((prev) => ({
        ...prev,
        advertising: {
          ...prev.advertising,
          portfolio: prev.advertising.portfolio.filter((_, i) => i !== index),
        },
      }));
      setFeedback({
        section: 'adPortfolio',
        type: 'success',
        message: 'نمونه‌کار حذف شد — برای اعمال، «نمونه‌کارها» را ذخیره کنید',
      });
      return;
    }

    if (kind === 'collaborationType') {
      setContent((prev) => ({
        ...prev,
        collaborate: {
          ...prev.collaborate,
          collaborationTypes: prev.collaborate.collaborationTypes.filter((_, i) => i !== index),
        },
      }));
      setFeedback({
        section: 'collaborationTypes',
        type: 'success',
        message: 'مورد حذف شد — برای اعمال، «انواع همکاری» را ذخیره کنید',
      });
      return;
    }

    if (kind === 'job') {
      setContent((prev) => ({
        ...prev,
        collaborate: {
          ...prev.collaborate,
          jobs: prev.collaborate.jobs.filter((_, i) => i !== index),
        },
      }));
      setFeedback({
        section: 'jobs',
        type: 'success',
        message: 'فراخوان حذف شد — برای اعمال، «فراخوان‌ها» را ذخیره کنید',
      });
      return;
    }

    setContent((prev) => ({
      ...prev,
      collaborate: {
        ...prev.collaborate,
        guidelines: prev.collaborate.guidelines.filter((_, i) => i !== index),
      },
    }));
    setFeedback({
      section: 'guidelines',
      type: 'success',
      message: 'راهنما حذف شد — برای اعمال، «راهنمای نگارش» را ذخیره کنید',
    });
  };

  const deleteDialog =
    pendingDelete?.kind === 'adPricing'
      ? {
          title: 'حذف تعرفه تبلیغاتی؟',
          description: 'این تعرفه از صفحه تبلیغات و گزینه‌های فرم درخواست حذف می‌شود.',
          reasons: AD_PRICING_DELETE_REASONS,
        }
      : pendingDelete?.kind === 'adPlacement'
        ? {
            title: 'حذف جایگاه تبلیغاتی؟',
            description: 'این جایگاه از شماتیک صفحه تبلیغات سایت حذف می‌شود.',
            reasons: AD_PLACEMENT_DELETE_REASONS,
          }
        : pendingDelete?.kind === 'adPortfolio'
          ? {
              title: 'حذف نمونه‌کار؟',
              description: 'این مورد از بخش نمونه‌کارهای صفحه تبلیغات حذف می‌شود.',
              reasons: AD_PORTFOLIO_DELETE_REASONS,
            }
          : pendingDelete?.kind === 'collaborationType'
            ? {
                title: 'حذف نوع همکاری؟',
                description: 'این گزینه از فرم ارسال رزومه در سایت حذف می‌شود.',
                reasons: TYPE_DELETE_REASONS,
              }
            : pendingDelete?.kind === 'job'
              ? {
                  title: 'حذف فراخوان همکاری؟',
                  description: 'این موقعیت از صفحه همکاری سایت حذف می‌شود.',
                  reasons: JOB_DELETE_REASONS,
                }
              : pendingDelete?.kind === 'guideline'
                ? {
                    title: 'حذف راهنمای نگارش؟',
                    description: 'این راهنما از صفحه همکاری سایت حذف می‌شود.',
                    reasons: GUIDE_DELETE_REASONS,
                  }
                : null;

  return (
    <div className="space-y-4">
      <SettingsAccordionSection
        title="منوی خدمات (هدر)"
        description="آیتم‌های منوی خدمات در هدر سایت"
        defaultOpen
        canEdit={canEdit}
        saving={savingSection === 'nav'}
        onSave={() => saveSection('nav', 'منوی خدمات', content.nav)}
        feedback={feedback?.section === 'nav' ? feedback : null}
        onDismissFeedback={dismissFeedback}
      >
        <div className="space-y-4">
          {content.nav.map((item, index) => (
            <div
              key={item.href}
              className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-2"
            >
              <div>
                <Label>عنوان</Label>
                <Input
                  value={item.label}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      nav: prev.nav.map((n, i) =>
                        i === index ? { ...n, label: e.target.value } : n,
                      ),
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>
              <div>
                <Label>توضیح کوتاه</Label>
                <Input
                  value={item.description}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      nav: prev.nav.map((n, i) =>
                        i === index ? { ...n, description: e.target.value } : n,
                      ),
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </div>
            </div>
          ))}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="صفحه تبلیغات — عناوین"
        description="عنوان صفحه و سرتیتر تعرفه، فرم و نمونه‌کارها"
        canEdit={canEdit}
        saving={savingSection === 'advertising'}
        onSave={() =>
          saveSection('advertising', 'عناوین تبلیغات', {
            title: content.advertising.title,
            description: content.advertising.description,
            pricingTitle: content.advertising.pricingTitle,
            pricingSubtitle: content.advertising.pricingSubtitle,
            placementsTitle: content.advertising.placementsTitle,
            placementsSubtitle: content.advertising.placementsSubtitle,
            formTitle: content.advertising.formTitle,
            formSubtitle: content.advertising.formSubtitle,
            portfolioTitle: content.advertising.portfolioTitle,
            portfolioSubtitle: content.advertising.portfolioSubtitle,
          })
        }
        feedback={feedback?.section === 'advertising' ? feedback : null}
        onDismissFeedback={dismissFeedback}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>عنوان صفحه</Label>
            <Input
              value={content.advertising.title}
              disabled={!canEdit}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  advertising: { ...prev.advertising, title: e.target.value },
                }))
              }
              className="mt-2 rounded-xl"
            />
          </div>
          <div className="md:col-span-2">
            <Label>توضیح صفحه</Label>
            <Textarea
              value={content.advertising.description}
              disabled={!canEdit}
              rows={2}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  advertising: { ...prev.advertising, description: e.target.value },
                }))
              }
              className="mt-2 rounded-xl"
            />
          </div>
          {(
            [
              ['pricingTitle', 'عنوان تعرفه‌ها'],
              ['pricingSubtitle', 'زیرعنوان تعرفه‌ها'],
              ['placementsTitle', 'عنوان جایگاه‌ها'],
              ['placementsSubtitle', 'زیرعنوان جایگاه‌ها'],
              ['formTitle', 'عنوان فرم درخواست'],
              ['formSubtitle', 'زیرعنوان فرم درخواست'],
              ['portfolioTitle', 'عنوان نمونه‌کارها'],
              ['portfolioSubtitle', 'زیرعنوان نمونه‌کارها'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                value={content.advertising[key]}
                disabled={!canEdit}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    advertising: { ...prev.advertising, [key]: e.target.value },
                  }))
                }
                className="mt-2 rounded-xl"
              />
            </div>
          ))}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="تعرفه‌های تبلیغاتی"
        description="موارد جدول تعرفه و گزینه‌های فرم درخواست آگهی"
        canEdit={canEdit}
        saving={savingSection === 'adPricing'}
        onSave={() => saveSection('adPricing', 'تعرفه‌های تبلیغاتی', content.advertising.pricing)}
        feedback={feedback?.section === 'adPricing' ? feedback : null}
        onDismissFeedback={dismissFeedback}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  advertising: {
                    ...prev.advertising,
                    pricing: [
                      ...prev.advertising.pricing,
                      {
                        id: newId('ad'),
                        type: 'print',
                        name: '',
                        size: '',
                        price: 0,
                        description: '',
                        isActive: true,
                      },
                    ],
                  },
                }))
              }
            >
              افزودن
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {content.advertising.pricing.map((item, index) => (
            <div
              key={item.id}
              className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-6"
            >
              <div className="md:col-span-2">
                <Label>نام تعرفه</Label>
                <Input
                  value={item.name}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        pricing: prev.advertising.pricing.map((row, i) =>
                          i === index ? { ...row, name: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label>نوع</Label>
                <Select
                  value={item.type}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        pricing: prev.advertising.pricing.map((row, i) =>
                          i === index
                            ? { ...row, type: e.target.value as 'print' | 'digital' }
                            : row,
                        ),
                      },
                    }))
                  }
                >
                  <option value="print">چاپی</option>
                  <option value="digital">دیجیتال</option>
                </Select>
              </div>
              <div>
                <Label>ابعاد / قالب</Label>
                <Input
                  value={item.size}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        pricing: prev.advertising.pricing.map((row, i) =>
                          i === index ? { ...row, size: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label>قیمت (تومان)</Label>
                <Input
                  type="number"
                  min={0}
                  dir="ltr"
                  value={item.price}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        pricing: prev.advertising.pricing.map((row, i) =>
                          i === index
                            ? { ...row, price: Math.max(0, Number(e.target.value) || 0) }
                            : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Label>توضیح</Label>
                <Input
                  value={item.description}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        pricing: prev.advertising.pricing.map((row, i) =>
                          i === index ? { ...row, description: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Label>جایگاه مرتبط</Label>
                <Select
                  value={item.placementId ?? ''}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        pricing: prev.advertising.pricing.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                placementId: e.target.value || undefined,
                              }
                            : row,
                        ),
                      },
                    }))
                  }
                >
                  <option value="">بدون پیوند</option>
                  {content.advertising.placements.map((placement) => (
                    <option key={placement.id} value={placement.id}>
                      {placement.label} (
                      {AD_SURFACE_META.find((s) => s.id === placement.surface)?.label ??
                        placement.surface}
                      )
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col justify-end gap-2 md:col-span-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.isActive !== false}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        advertising: {
                          ...prev.advertising,
                          pricing: prev.advertising.pricing.map((row, i) =>
                            i === index ? { ...row, isActive: e.target.checked } : row,
                          ),
                        },
                      }))
                    }
                  />
                  فعال
                </label>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive justify-start px-0"
                    onClick={() => setPendingDelete({ kind: 'adPricing', index })}
                  >
                    حذف
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="جایگاه‌های تبلیغاتی"
        description="شماتیک جاگذاری آگهی در سایت، مقاله، ماهنامه و خبرنامه"
        canEdit={canEdit}
        saving={savingSection === 'adPlacements'}
        onSave={() =>
          saveSection('adPlacements', 'جایگاه‌های تبلیغاتی', content.advertising.placements)
        }
        feedback={feedback?.section === 'adPlacements' ? feedback : null}
        onDismissFeedback={dismissFeedback}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                const surface: AdSurfaceId = 'website-home';
                const slots = listSlotOptions(surface);
                const used = new Set(
                  content.advertising.placements
                    .filter((p) => p.surface === surface)
                    .map((p) => p.slotKey),
                );
                const free = slots.find((s) => !used.has(s.key)) ?? slots[0];
                if (!free) return;
                setContent((prev) => ({
                  ...prev,
                  advertising: {
                    ...prev.advertising,
                    placements: [
                      ...prev.advertising.placements,
                      {
                        id: newId('place'),
                        surface,
                        slotKey: free.key,
                        label: free.defaultLabel,
                        description: '',
                        sizeHint: '',
                        isActive: true,
                      },
                    ],
                  },
                }));
              }}
            >
              افزودن
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {content.advertising.placements.map((item, index) => {
            const slots = listSlotOptions(item.surface);
            return (
              <div
                key={item.id}
                className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-6"
              >
                <div className="md:col-span-2">
                  <Label>عنوان نمایشی</Label>
                  <Input
                    value={item.label}
                    disabled={!canEdit}
                    className="mt-2 rounded-xl"
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        advertising: {
                          ...prev.advertising,
                          placements: prev.advertising.placements.map((row, i) =>
                            i === index ? { ...row, label: e.target.value } : row,
                          ),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>سطح / صفحه</Label>
                  <Select
                    value={item.surface}
                    disabled={!canEdit}
                    className="mt-2 rounded-xl"
                    onChange={(e) => {
                      const surface = e.target.value as AdSurfaceId;
                      const nextSlots = listSlotOptions(surface);
                      const nextSlot = nextSlots[0];
                      if (!nextSlot) return;
                      setContent((prev) => ({
                        ...prev,
                        advertising: {
                          ...prev.advertising,
                          placements: prev.advertising.placements.map((row, i) =>
                            i === index
                              ? {
                                  ...row,
                                  surface,
                                  slotKey: nextSlot.key,
                                  label: row.label || nextSlot.defaultLabel,
                                }
                              : row,
                          ),
                        },
                      }));
                    }}
                  >
                    {AD_SURFACE_META.map((surface) => (
                      <option key={surface.id} value={surface.id}>
                        {surface.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>موقعیت شماتیک</Label>
                  <Select
                    value={item.slotKey}
                    disabled={!canEdit}
                    className="mt-2 rounded-xl"
                    onChange={(e) => {
                      const slotKey = e.target.value;
                      const slot = slots.find((s) => s.key === slotKey);
                      setContent((prev) => ({
                        ...prev,
                        advertising: {
                          ...prev.advertising,
                          placements: prev.advertising.placements.map((row, i) =>
                            i === index
                              ? {
                                  ...row,
                                  slotKey,
                                  label: row.label || slot?.defaultLabel || row.label,
                                }
                              : row,
                          ),
                        },
                      }));
                    }}
                  >
                    {slots.map((slot) => (
                      <option key={slot.key} value={slot.key}>
                        {slot.defaultLabel}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>ابعاد پیشنهادی</Label>
                  <Input
                    value={item.sizeHint}
                    disabled={!canEdit}
                    className="mt-2 rounded-xl"
                    placeholder="مثلاً 300×600"
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        advertising: {
                          ...prev.advertising,
                          placements: prev.advertising.placements.map((row, i) =>
                            i === index ? { ...row, sizeHint: e.target.value } : row,
                          ),
                        },
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-3">
                  <Label>توضیح برای مشتری</Label>
                  <Input
                    value={item.description}
                    disabled={!canEdit}
                    className="mt-2 rounded-xl"
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        advertising: {
                          ...prev.advertising,
                          placements: prev.advertising.placements.map((row, i) =>
                            i === index ? { ...row, description: e.target.value } : row,
                          ),
                        },
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>تعرفه مرتبط</Label>
                  <Select
                    value={item.pricingId ?? ''}
                    disabled={!canEdit}
                    className="mt-2 rounded-xl"
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        advertising: {
                          ...prev.advertising,
                          placements: prev.advertising.placements.map((row, i) =>
                            i === index ? { ...row, pricingId: e.target.value || undefined } : row,
                          ),
                        },
                      }))
                    }
                  >
                    <option value="">بدون پیوند</option>
                    {content.advertising.pricing.map((tariff) => (
                      <option key={tariff.id} value={tariff.id}>
                        {tariff.name || tariff.id}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.isActive !== false}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          advertising: {
                            ...prev.advertising,
                            placements: prev.advertising.placements.map((row, i) =>
                              i === index ? { ...row, isActive: e.target.checked } : row,
                            ),
                          },
                        }))
                      }
                    />
                    فعال
                  </label>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive justify-start px-0"
                      onClick={() => setPendingDelete({ kind: 'adPlacement', index })}
                    >
                      حذف
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="نمونه‌کارهای تبلیغاتی"
        description="افزودن نمونه‌کار یا آگهی با تصویر برای نمایش در سایت"
        canEdit={canEdit}
        saving={savingSection === 'adPortfolio'}
        onSave={() => saveSection('adPortfolio', 'نمونه‌کارها', content.advertising.portfolio)}
        feedback={feedback?.section === 'adPortfolio' ? feedback : null}
        onDismissFeedback={dismissFeedback}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  advertising: {
                    ...prev.advertising,
                    portfolio: [
                      ...prev.advertising.portfolio,
                      {
                        id: newId('port'),
                        title: '',
                        client: '',
                        image: '/images/mock/placeholder-ad.svg',
                        type: 'digital',
                        isActive: true,
                      },
                    ],
                  },
                }))
              }
            >
              افزودن
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {content.advertising.portfolio.map((item, index) => (
            <div
              key={item.id}
              className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-6"
            >
              <div className="flex justify-center md:col-span-1">
                <PortfolioImageUploader
                  image={item.image}
                  title={item.title || 'نمونه‌کار'}
                  disabled={!canEdit}
                  uploading={uploadingPortfolioId === item.id}
                  onFile={(file) => void uploadPortfolioImage(index, file)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>عنوان</Label>
                <Input
                  value={item.title}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        portfolio: prev.advertising.portfolio.map((row, i) =>
                          i === index ? { ...row, title: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>مشتری / برند</Label>
                <Input
                  value={item.client}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        portfolio: prev.advertising.portfolio.map((row, i) =>
                          i === index ? { ...row, client: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label>نوع</Label>
                <Select
                  value={item.type}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        portfolio: prev.advertising.portfolio.map((row, i) =>
                          i === index
                            ? { ...row, type: e.target.value as 'print' | 'digital' }
                            : row,
                        ),
                      },
                    }))
                  }
                >
                  <option value="print">چاپی</option>
                  <option value="digital">دیجیتال</option>
                </Select>
              </div>
              <div className="md:col-span-4">
                <Label>آدرس تصویر (یا از آپلود بالا)</Label>
                <Input
                  value={item.image}
                  disabled={!canEdit}
                  dir="ltr"
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      advertising: {
                        ...prev.advertising,
                        portfolio: prev.advertising.portfolio.map((row, i) =>
                          i === index ? { ...row, image: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div className="flex flex-col justify-end gap-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.isActive !== false}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        advertising: {
                          ...prev.advertising,
                          portfolio: prev.advertising.portfolio.map((row, i) =>
                            i === index ? { ...row, isActive: e.target.checked } : row,
                          ),
                        },
                      }))
                    }
                  />
                  فعال
                </label>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive justify-start px-0"
                    onClick={() => setPendingDelete({ kind: 'adPortfolio', index })}
                  >
                    حذف
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="صفحه همکاری — عناوین"
        description="عنوان صفحه و سرتیتر فرم‌ها، فراخوان‌ها و راهنما"
        canEdit={canEdit}
        saving={savingSection === 'collaborateMeta'}
        onSave={() =>
          saveSection('collaborateMeta', 'عناوین همکاری', {
            title: content.collaborate.title,
            description: content.collaborate.description,
            formTitle: content.collaborate.formTitle,
            formSubtitle: content.collaborate.formSubtitle,
            resumeTitle: content.collaborate.resumeTitle,
            resumeSubtitle: content.collaborate.resumeSubtitle,
            jobsTitle: content.collaborate.jobsTitle,
            jobsSubtitle: content.collaborate.jobsSubtitle,
            guidelinesTitle: content.collaborate.guidelinesTitle,
            guidelinesSubtitle: content.collaborate.guidelinesSubtitle,
          })
        }
        feedback={feedback?.section === 'collaborateMeta' ? feedback : null}
        onDismissFeedback={dismissFeedback}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>عنوان صفحه</Label>
            <Input
              value={content.collaborate.title}
              disabled={!canEdit}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  collaborate: { ...prev.collaborate, title: e.target.value },
                }))
              }
              className="mt-2 rounded-xl"
            />
          </div>
          <div className="md:col-span-2">
            <Label>توضیح صفحه</Label>
            <Textarea
              value={content.collaborate.description}
              disabled={!canEdit}
              rows={2}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  collaborate: { ...prev.collaborate, description: e.target.value },
                }))
              }
              className="mt-2 rounded-xl"
            />
          </div>
          {(
            [
              ['formTitle', 'عنوان فرم ارسال مقاله'],
              ['formSubtitle', 'زیرعنوان فرم مقاله'],
              ['resumeTitle', 'عنوان فرم همکاری / رزومه'],
              ['resumeSubtitle', 'زیرعنوان فرم همکاری'],
              ['jobsTitle', 'عنوان فراخوان‌ها'],
              ['jobsSubtitle', 'زیرعنوان فراخوان‌ها'],
              ['guidelinesTitle', 'عنوان راهنمای نگارش'],
              ['guidelinesSubtitle', 'زیرعنوان راهنمای نگارش'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                value={content.collaborate[key]}
                disabled={!canEdit}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    collaborate: { ...prev.collaborate, [key]: e.target.value },
                  }))
                }
                className="mt-2 rounded-xl"
              />
            </div>
          ))}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="انواع همکاری"
        description="گزینه‌های فرم ارسال رزومه در سایت"
        canEdit={canEdit}
        saving={savingSection === 'collaborationTypes'}
        onSave={() =>
          saveSection('collaborationTypes', 'انواع همکاری', content.collaborate.collaborationTypes)
        }
        feedback={feedback?.section === 'collaborationTypes' ? feedback : null}
        onDismissFeedback={dismissFeedback}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  collaborate: {
                    ...prev.collaborate,
                    collaborationTypes: [
                      ...prev.collaborate.collaborationTypes,
                      { id: newId('collab'), label: '', description: '', isActive: true },
                    ],
                  },
                }))
              }
            >
              افزودن
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {content.collaborate.collaborationTypes.map((item, index) => (
            <div
              key={item.id}
              className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-6"
            >
              <div className="md:col-span-2">
                <Label>عنوان</Label>
                <Input
                  value={item.label}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      collaborate: {
                        ...prev.collaborate,
                        collaborationTypes: prev.collaborate.collaborationTypes.map((row, i) =>
                          i === index ? { ...row, label: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Label>توضیح (اختیاری)</Label>
                <Input
                  value={item.description ?? ''}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      collaborate: {
                        ...prev.collaborate,
                        collaborationTypes: prev.collaborate.collaborationTypes.map((row, i) =>
                          i === index ? { ...row, description: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.isActive !== false}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        collaborate: {
                          ...prev.collaborate,
                          collaborationTypes: prev.collaborate.collaborationTypes.map((row, i) =>
                            i === index ? { ...row, isActive: e.target.checked } : row,
                          ),
                        },
                      }))
                    }
                  />
                  فعال
                </label>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive justify-start px-0"
                    onClick={() => setPendingDelete({ kind: 'collaborationType', index })}
                  >
                    حذف
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="فراخوان‌های همکاری"
        description="موقعیت‌های نمایش‌داده‌شده در صفحه عمومی"
        canEdit={canEdit}
        saving={savingSection === 'jobs'}
        onSave={() => saveSection('jobs', 'فراخوان‌ها', content.collaborate.jobs)}
        feedback={feedback?.section === 'jobs' ? feedback : null}
        onDismissFeedback={dismissFeedback}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  collaborate: {
                    ...prev.collaborate,
                    jobs: [
                      ...prev.collaborate.jobs,
                      {
                        id: newId('job'),
                        title: '',
                        type: 'freelance',
                        description: '',
                        deadline: new Date().toISOString().slice(0, 10),
                        isActive: true,
                      },
                    ],
                  },
                }))
              }
            >
              افزودن
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {content.collaborate.jobs.map((job, index) => (
            <div
              key={job.id}
              className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-2"
            >
              <div>
                <Label>عنوان</Label>
                <Input
                  value={job.title}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      collaborate: {
                        ...prev.collaborate,
                        jobs: prev.collaborate.jobs.map((row, i) =>
                          i === index ? { ...row, title: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label>نوع</Label>
                <Select
                  value={job.type}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      collaborate: {
                        ...prev.collaborate,
                        jobs: prev.collaborate.jobs.map((row, i) =>
                          i === index
                            ? { ...row, type: e.target.value as 'freelance' | 'fulltime' }
                            : row,
                        ),
                      },
                    }))
                  }
                >
                  <option value="freelance">فریلنس</option>
                  <option value="fulltime">تمام‌وقت</option>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>توضیح</Label>
                <Textarea
                  value={job.description}
                  disabled={!canEdit}
                  rows={2}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      collaborate: {
                        ...prev.collaborate,
                        jobs: prev.collaborate.jobs.map((row, i) =>
                          i === index ? { ...row, description: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div>
                <JalaliDateField
                  id={`job-deadline-${job.id}`}
                  label="مهلت"
                  required
                  showPresets
                  boundary="start"
                  value={job.deadline}
                  disabled={!canEdit}
                  hint="تاریخ شمسی — در سایت به‌صورت جلالی نمایش داده می‌شود"
                  onChange={(iso) =>
                    setContent((prev) => ({
                      ...prev,
                      collaborate: {
                        ...prev.collaborate,
                        jobs: prev.collaborate.jobs.map((row, i) =>
                          i === index ? { ...row, deadline: toDateOnly(iso) } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-end justify-between gap-3">
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={job.isActive !== false}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        collaborate: {
                          ...prev.collaborate,
                          jobs: prev.collaborate.jobs.map((row, i) =>
                            i === index ? { ...row, isActive: e.target.checked } : row,
                          ),
                        },
                      }))
                    }
                  />
                  فعال
                </label>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setPendingDelete({ kind: 'job', index })}
                  >
                    حذف
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="راهنمای نگارش"
        description="دستورالعمل‌های نمایش‌داده‌شده برای نویسندگان"
        canEdit={canEdit}
        saving={savingSection === 'guidelines'}
        onSave={() => saveSection('guidelines', 'راهنمای نگارش', content.collaborate.guidelines)}
        feedback={feedback?.section === 'guidelines' ? feedback : null}
        onDismissFeedback={dismissFeedback}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  collaborate: {
                    ...prev.collaborate,
                    guidelines: [
                      ...prev.collaborate.guidelines,
                      { id: newId('guide'), title: '', content: '' },
                    ],
                  },
                }))
              }
            >
              افزودن
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {content.collaborate.guidelines.map((guide, index) => (
            <div key={guide.id} className="border-border grid gap-3 rounded-xl border p-4">
              <div>
                <Label>عنوان</Label>
                <Input
                  value={guide.title}
                  disabled={!canEdit}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      collaborate: {
                        ...prev.collaborate,
                        guidelines: prev.collaborate.guidelines.map((row, i) =>
                          i === index ? { ...row, title: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label>متن</Label>
                <Textarea
                  value={guide.content}
                  disabled={!canEdit}
                  rows={3}
                  className="mt-2 rounded-xl"
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      collaborate: {
                        ...prev.collaborate,
                        guidelines: prev.collaborate.guidelines.map((row, i) =>
                          i === index ? { ...row, content: e.target.value } : row,
                        ),
                      },
                    }))
                  }
                />
              </div>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive justify-start px-0"
                  onClick={() => setPendingDelete({ kind: 'guideline', index })}
                >
                  حذف
                </Button>
              )}
            </div>
          ))}
        </div>
      </SettingsAccordionSection>

      <ReasonConfirmDialog
        open={Boolean(pendingDelete)}
        title={deleteDialog?.title ?? 'حذف؟'}
        description={deleteDialog?.description ?? ''}
        reasons={deleteDialog?.reasons}
        confirmLabel="تأیید حذف"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => confirmDelete()}
      />
    </div>
  );
}

function PortfolioImageUploader({
  image,
  title,
  disabled,
  uploading,
  onFile,
}: {
  image: string;
  title: string;
  disabled?: boolean;
  uploading?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = image.startsWith('/uploads/')
    ? adminPath(image)
    : image || '/images/mock/placeholder-ad.svg';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview}
        alt={title}
        className="border-border bg-muted h-20 w-28 rounded-xl border object-cover"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = '';
        }}
      />
      <LoadingButton
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full"
        disabled={disabled}
        loading={Boolean(uploading)}
        onClick={() => inputRef.current?.click()}
      >
        آپلود تصویر
      </LoadingButton>
    </div>
  );
}
