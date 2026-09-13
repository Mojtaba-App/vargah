export const PaymentType = {
  SUBSCRIPTION: 'SUBSCRIPTION',
  ADVERTISEMENT: 'ADVERTISEMENT',
  OTHER: 'OTHER',
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export type PaymentTypeFilter = PaymentType | 'ALL';
export type PaymentStatusFilter = PaymentStatus | 'ALL';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  SUBSCRIPTION: 'اشتراک',
  ADVERTISEMENT: 'تبلیغات',
  OTHER: 'سایر',
};

export const PAYMENT_TYPE_VARIANT: Record<
  PaymentType,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  SUBSCRIPTION: 'default',
  ADVERTISEMENT: 'secondary',
  OTHER: 'outline',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'در انتظار',
  PAID: 'پرداخت‌شده',
  FAILED: 'ناموفق',
  REFUNDED: 'بازگشت وجه',
};

export const PAYMENT_STATUS_VARIANT: Record<
  PaymentStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  PENDING: 'outline',
  PAID: 'default',
  FAILED: 'destructive',
  REFUNDED: 'secondary',
};

export const PAYMENT_TYPE_COLORS: Record<PaymentType, string> = {
  SUBSCRIPTION: '#6366f1',
  ADVERTISEMENT: '#06b6d4',
  OTHER: '#94a3b8',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PAID: '#10b981',
  PENDING: '#f59e0b',
  FAILED: '#ef4444',
  REFUNDED: '#8b5cf6',
};
