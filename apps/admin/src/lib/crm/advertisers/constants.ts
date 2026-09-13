import { AdCampaignStatus } from '@vargah/database/enums';

export const CAMPAIGN_STATUS_LABELS: Record<AdCampaignStatus, string> = {
  DRAFT: 'پیش‌نویس',
  ACTIVE: 'فعال',
  PAUSED: 'متوقف',
  COMPLETED: 'پایان‌یافته',
  CANCELLED: 'لغوشده',
};

export const CAMPAIGN_STATUS_VARIANT: Record<
  AdCampaignStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  DRAFT: 'outline',
  ACTIVE: 'default',
  PAUSED: 'secondary',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

export const CAMPAIGN_TYPES = [
  { value: 'full-page', label: 'صفحه کامل' },
  { value: 'half-page', label: 'نیم‌صفحه' },
  { value: 'quarter-page', label: 'ربع‌صفحه' },
  { value: 'banner', label: 'بنر سایت' },
  { value: 'sponsored-article', label: 'مطلب اسپانسری' },
  { value: 'newsletter', label: 'خبرنامه' },
  { value: 'social', label: 'شبکه‌های اجتماعی' },
  { value: 'combo', label: 'بسته ترکیبی' },
] as const;

export const TARIFF_PRESETS = [
  { label: '۵ میلیون', value: 5_000_000 },
  { label: '۱۰ میلیون', value: 10_000_000 },
  { label: '۱۵ میلیون', value: 15_000_000 },
  { label: '۲۵ میلیون', value: 25_000_000 },
  { label: '۵۰ میلیون', value: 50_000_000 },
] as const;

export function getCampaignTypeLabel(type: string): string {
  return CAMPAIGN_TYPES.find((item) => item.value === type)?.label ?? type;
}

export type CampaignStatusFilter = 'ALL' | AdCampaignStatus;

export function isCampaignRunning(status: AdCampaignStatus, startDate: Date, endDate: Date): boolean {
  if (status !== AdCampaignStatus.ACTIVE) return false;
  const now = Date.now();
  return startDate.getTime() <= now && endDate.getTime() >= now;
}

export function getCampaignDurationDays(startDate: Date, endDate: Date): number {
  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
}
