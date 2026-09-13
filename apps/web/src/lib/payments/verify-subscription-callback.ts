import { revalidatePath } from 'next/cache';
import { PaymentStatus, prisma } from '@vargah/database';
import { getActiveSubscriptionPlans } from '@vargah/business/subscription-plans';
import { normalizeDiscountCode } from '@vargah/business/discounts';
import {
  formatSubscriptionCartPaymentDescription,
  parseSubscriptionCartLines,
  pickPrimarySubscriptionPlan,
  resolveSubscriptionCartLines,
  sumSubscriptionCartTotals,
} from '@vargah/business/subscription-cart';
import { resolvePaymentConfig } from '@vargah/business/payment-config';
import { zarinpalVerifyPayment } from '@vargah/business/zarinpal';
import { activateSubscriptionPayment } from '@vargah/business/subscription-activation';

import { getPaymentConfig } from '@/lib/payment-config';
import { getSubscriptionPlans } from '@/lib/subscription-plans';

async function loadPlans() {
  const all = await getSubscriptionPlans();
  return getActiveSubscriptionPlans(all.length ? all : []);
}

/**
 * فقط از Route Handler کال‌بک زرین‌پال فراخوانی شود — Server Action عمومی نیست.
 */
export async function verifySubscriptionCallback(params: {
  paymentId: string;
  authority: string;
  status: string;
}) {
  if (params.status !== 'OK') {
    const payment = await prisma.payment.findUnique({ where: { id: params.paymentId } });
    if (payment && payment.status === PaymentStatus.PENDING) {
      await prisma.payment.update({
        where: { id: params.paymentId },
        data: { status: PaymentStatus.FAILED },
      });
    }
    return { ok: false as const, reason: 'cancelled' as const };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    include: { subscriber: true },
  });

  if (!payment || !payment.subscriber) {
    return { ok: false as const, reason: 'not_found' as const };
  }

  const subscriber = payment.subscriber;

  if (payment.status === PaymentStatus.PAID) {
    return {
      ok: true as const,
      alreadyPaid: true as const,
      subscriber: {
        id: subscriber.id,
        phone: subscriber.phone,
        name: subscriber.name,
        email: subscriber.email,
      },
    };
  }

  if (payment.transactionId !== params.authority) {
    return { ok: false as const, reason: 'mismatch' as const };
  }

  const [paymentConfig, plans] = await Promise.all([getPaymentConfig(), loadPlans()]);
  const resolved = resolvePaymentConfig(paymentConfig);
  const amount = Number(payment.amount);

  const verify = await zarinpalVerifyPayment({
    merchantId: resolved.zarinpal.merchantId,
    amount,
    authority: params.authority,
    sandbox: resolved.zarinpal.sandbox,
  });

  const cartItems = parseSubscriptionCartLines(payment.description);
  const lines = resolveSubscriptionCartLines(
    plans,
    cartItems.length
      ? cartItems
      : subscriber.planType
        ? [{ planSlug: subscriber.planType, quantity: 1 }]
        : [],
  );
  const primaryPlan = pickPrimarySubscriptionPlan(lines);
  const totals = sumSubscriptionCartTotals(lines);

  if (!primaryPlan || lines.length === 0) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    return { ok: false as const, reason: 'plan_missing' as const };
  }

  const activation = await activateSubscriptionPayment(prisma, {
    paymentId: payment.id,
    subscriberId: subscriber.id,
    plan: primaryPlan,
    refId: String(verify.refId),
    periodMonths: totals.periodMonths,
    description: payment.description ?? formatSubscriptionCartPaymentDescription(lines),
  });

  if (!activation.activated) {
    return {
      ok: true as const,
      alreadyPaid: true as const,
      refId: verify.refId,
      subscriber: {
        id: subscriber.id,
        phone: subscriber.phone,
        name: subscriber.name,
        email: subscriber.email,
      },
    };
  }

  if (payment.discountCode && Number(payment.discountAmount ?? 0) > 0) {
    const codeRow = await prisma.discountCode.findUnique({
      where: { code: normalizeDiscountCode(payment.discountCode) },
    });
    if (codeRow) {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.discountRedemption.findUnique({
          where: { paymentId: payment.id },
        });
        if (existing) return;

        await tx.discountRedemption.create({
          data: {
            discountCodeId: codeRow.id,
            paymentId: payment.id,
            subscriberId: subscriber.id,
            codeSnapshot: codeRow.code,
            amountOff: Number(payment.discountAmount),
          },
        });
        await tx.discountCode.update({
          where: { id: codeRow.id },
          data: { usedCount: { increment: 1 } },
        });
      });
    }
  }

  revalidatePath('/subscription');
  revalidatePath('/profile');

  return {
    ok: true as const,
    alreadyPaid: false as const,
    refId: verify.refId,
    subscriber: {
      id: subscriber.id,
      phone: subscriber.phone,
      name: subscriber.name,
      email: subscriber.email,
    },
  };
}
