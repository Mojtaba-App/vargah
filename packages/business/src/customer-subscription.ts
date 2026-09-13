import type { SubscriptionStatus } from '@vargah/database';

export type CustomerSubscriptionView = {
  rawStatus: SubscriptionStatus;
  displayLabel: string;
  hasPurchases: boolean;
  hasActiveSubscription: boolean;
  showExpiredNotice: boolean;
  showPendingNotice: boolean;
};

type PaymentLike = { status: 'paid' | 'pending' | 'failed' };

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  NONE: 'بدون اشتراک',
  ACTIVE: 'فعال',
  EXPIRED: 'منقضی',
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CANCELLED: 'لغوشده',
};

/** وضعیت نمایشی اشتراک — بدون خرید، «در انتظار پرداخت» نشان داده نمی‌شود */
export function resolveCustomerSubscriptionView(input: {
  status: SubscriptionStatus;
  planType: string | null;
  expiresAt: Date | null;
  payments: PaymentLike[];
}): CustomerSubscriptionView {
  const hasPurchases = input.payments.length > 0;
  const hasPendingPurchase = input.payments.some((p) => p.status === 'pending');

  const isFreshAccount =
    !hasPurchases &&
    !input.planType &&
    (input.status === 'PENDING_PAYMENT' || input.status === 'NONE');

  if (isFreshAccount) {
    return {
      rawStatus: input.status,
      displayLabel: STATUS_LABELS.NONE,
      hasPurchases: false,
      hasActiveSubscription: false,
      showExpiredNotice: false,
      showPendingNotice: false,
    };
  }

  return {
    rawStatus: input.status,
    displayLabel: STATUS_LABELS[input.status] ?? input.status,
    hasPurchases,
    hasActiveSubscription: input.status === 'ACTIVE',
    showExpiredNotice: input.status === 'EXPIRED' && hasPurchases,
    showPendingNotice:
      input.status === 'PENDING_PAYMENT' && hasPurchases && hasPendingPurchase,
  };
}

export function getDeliveryContactPhone(
  deliveryPhone: string | null | undefined,
  accountPhone: string | null | undefined,
): string | null {
  return deliveryPhone?.trim() || accountPhone?.trim() || null;
}
