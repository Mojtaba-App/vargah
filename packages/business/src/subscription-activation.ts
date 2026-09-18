import type { PrismaClient } from '@vargah/database';
import { PaymentStatus, SubscriptionStatus } from '@vargah/database';

import { calculateSubscriptionExpiry } from './subscription';
import type { SubscriptionPlanConfig } from './subscription-plans';
import { formatSubscriptionPaymentDescription } from './subscription-plans';

export function computeRenewalExpiry(
  currentExpiresAt: Date | null | undefined,
  periodMonths: number,
  now = new Date(),
): Date {
  const base = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
  return calculateSubscriptionExpiry(base, periodMonths);
}

export type ActivateSubscriptionResult =
  | { activated: true; expiresAt: Date }
  | { activated: false; reason: 'already_paid' | 'not_pending' };

/**
 * فعال‌سازی اتمیک: فقط اگر پرداخت هنوز PENDING باشد به PAID تبدیل می‌شود.
 */
export async function activateSubscriptionPayment(
  db: Pick<PrismaClient, 'payment' | 'subscriber'>,
  params: {
    paymentId: string;
    subscriberId: string;
    plan: SubscriptionPlanConfig;
    refId: string;
    periodMonths?: number;
    description?: string;
  },
): Promise<ActivateSubscriptionResult> {
  const periodMonths = Math.max(1, params.periodMonths ?? params.plan.periodMonths);

  const subscriber = await db.subscriber.findUnique({
    where: { id: params.subscriberId },
    select: { expiresAt: true },
  });

  const expiresAt = computeRenewalExpiry(subscriber?.expiresAt, periodMonths);
  const paidAt = new Date();

  const updated = await db.payment.updateMany({
    where: { id: params.paymentId, status: PaymentStatus.PENDING },
    data: {
      status: PaymentStatus.PAID,
      transactionId: String(params.refId),
      paidAt,
      description: params.description ?? formatSubscriptionPaymentDescription(params.plan),
    },
  });

  if (updated.count === 0) {
    const current = await db.payment.findUnique({
      where: { id: params.paymentId },
      select: { status: true },
    });
    if (current?.status === PaymentStatus.PAID) {
      return { activated: false, reason: 'already_paid' };
    }
    return { activated: false, reason: 'not_pending' };
  }

  await db.subscriber.update({
    where: { id: params.subscriberId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      planType: params.plan.slug,
      expiresAt,
    },
  });

  return { activated: true, expiresAt };
}
