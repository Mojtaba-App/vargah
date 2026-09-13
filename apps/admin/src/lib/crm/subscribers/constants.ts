import { SubscriptionStatus } from '@vargah/database/enums';

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  NONE: 'بدون اشتراک',
  ACTIVE: 'فعال',
  EXPIRED: 'منقضی',
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CANCELLED: 'لغوشده',
};

export const SUBSCRIPTION_STATUS_VARIANT: Record<
  SubscriptionStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  NONE: 'outline',
  ACTIVE: 'default',
  EXPIRED: 'destructive',
  PENDING_PAYMENT: 'secondary',
  CANCELLED: 'outline',
};

export const SUBSCRIPTION_PLANS = [
  { value: 'digital-monthly', label: 'دیجیتال — ماهانه' },
  { value: 'digital-yearly', label: 'دیجیتال — سالانه' },
  { value: 'combo-monthly', label: 'ترکیبی — ماهانه' },
  { value: 'combo-yearly', label: 'ترکیبی — سالانه' },
  { value: 'print-yearly', label: 'چاپی — سالانه' },
] as const;

export function getPlanLabel(planType: string | null | undefined): string {
  if (!planType) return '—';
  return SUBSCRIPTION_PLANS.find((plan) => plan.value === planType)?.label ?? planType;
}

export type StatusFilter = 'ALL' | SubscriptionStatus | 'EXPIRING_SOON';

export function getDaysUntilExpiry(expiresAt: Date | null | undefined): number | null {
  if (!expiresAt) return null;
  const diff = expiresAt.getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function isExpiringSoon(expiresAt: Date | null | undefined, withinDays = 7): boolean {
  const days = getDaysUntilExpiry(expiresAt);
  return days !== null && days >= 0 && days <= withinDays;
}

export function getExpiryHint(expiresAt: Date | null | undefined): string | null {
  const days = getDaysUntilExpiry(expiresAt);
  if (days === null) return null;
  if (days < 0) return `${Math.abs(days)} روز گذشته`;
  if (days === 0) return 'امروز منقضی می‌شود';
  if (days <= 7) return `${days} روز تا انقضا`;
  return null;
}
