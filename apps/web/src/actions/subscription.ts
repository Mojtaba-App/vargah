'use server';

import { revalidatePath } from 'next/cache';
import { PaymentStatus, PaymentType, SubscriptionStatus, prisma } from '@vargah/database';
import { getActiveSubscriptionPlans } from '@vargah/business/subscription-plans';
import {
  applyCouponToSubtotal,
  normalizeDiscountCode,
  type CouponCandidate,
} from '@vargah/business/discounts';
import {
  cartRequiresAddress,
  formatSubscriptionCartPaymentDescription,
  pickPrimarySubscriptionPlan,
  resolveSubscriptionCartLines,
  sumSubscriptionCartTotals,
} from '@vargah/business/subscription-cart';
import {
  getPaymentCallbackUrl,
  isPaymentReady,
  resolvePaymentConfig,
} from '@vargah/business/payment-config';
import { zarinpalRequestPayment, zarinpalStartPayUrl } from '@vargah/business/zarinpal';
import { subscriberCityUpdate } from '@vargah/business/subscriber-location';
import { subscriptionCheckoutSchema } from '@vargah/security/schemas';
import { sanitizePlainText } from '@vargah/security/sanitize';

import { requireCustomerSession } from '@/actions/customer-auth';
import { getPaymentConfig } from '@/lib/payment-config';
import { getSubscriptionPlans } from '@/lib/subscription-plans';
import { rateLimitOrThrow } from '@/lib/rate-limit';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const CHECKOUT_LIMIT = 8;
const CHECKOUT_WINDOW_MS = 15 * 60 * 1000;

async function assertSubscriptionRateLimit(key: string, limit: number, windowMs: number) {
  if (!process.env.DATABASE_URL) return;
  await rateLimitOrThrow(key, limit, windowMs);
}

export type SubscriberDashboard = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  deliveryPhone: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  status: SubscriptionStatus;
  planType: string | null;
  planName: string | null;
  expiresAt: Date | null;
  payments: Array<{
    id: string;
    date: Date;
    amount: number;
    plan: string;
    status: 'paid' | 'pending' | 'failed';
  }>;
};

async function loadPlans() {
  const all = await getSubscriptionPlans();
  return getActiveSubscriptionPlans(all.length ? all : []);
}

export async function initiateSubscriptionCheckout(input: {
  items: Array<{ planSlug: string; quantity: number }>;
  name: string;
  email: string;
  phone: string;
  deliveryPhone?: string;
  province?: string;
  city?: string;
  address?: string;
  discountCode?: string;
}) {
  await verifyCsrfFromRequest();
  const customerSession = await requireCustomerSession();
  const parsed = subscriptionCheckoutSchema.parse(input);
  await assertSubscriptionRateLimit(
    `checkout:${customerSession.subscriberId}`,
    CHECKOUT_LIMIT,
    CHECKOUT_WINDOW_MS,
  );

  const [paymentConfig, plans] = await Promise.all([getPaymentConfig(), loadPlans()]);
  const resolved = resolvePaymentConfig(paymentConfig);
  if (!isPaymentReady(resolved)) {
    throw new Error('درگاه پرداخت فعلاً فعال نیست. لطفاً بعداً تلاش کنید.');
  }

  const lines = resolveSubscriptionCartLines(plans, parsed.items);
  if (lines.length === 0) {
    throw new Error('هیچ پلن معتبری در سبد نیست.');
  }

  const totals = sumSubscriptionCartTotals(lines);
  if (totals.amount <= 0) {
    throw new Error('مبلغ سبد نامعتبر است.');
  }

  let payableAmount = totals.amount;
  let discountAmount = 0;
  let appliedCode: string | null = null;

  const rawCode = parsed.discountCode?.trim();
  if (rawCode) {
    const couponResult = await resolveCouponForCheckout({
      code: rawCode,
      subtotal: totals.amount,
      planSlugs: lines.map((line) => line.plan.slug),
      subscriberId: customerSession.subscriberId,
    });
    if (!couponResult.ok) throw new Error(couponResult.message);
    payableAmount = couponResult.finalAmount;
    discountAmount = couponResult.amountOff;
    appliedCode = couponResult.code;
    if (payableAmount <= 0) {
      throw new Error('مبلغ نهایی پس از تخفیف نامعتبر است.');
    }
  }

  const primaryPlan = pickPrimarySubscriptionPlan(lines);
  if (!primaryPlan) throw new Error('پلن انتخاب‌شده یافت نشد یا غیرفعال است.');

  if (cartRequiresAddress(lines)) {
    if (!parsed.province?.trim() || !parsed.city?.trim() || !parsed.address?.trim()) {
      throw new Error('برای اشتراک چاپی یا ترکیبی، آدرس کامل الزامی است.');
    }
  }

  const description = formatSubscriptionCartPaymentDescription(lines);

  const subscriber = await prisma.subscriber.update({
    where: { id: customerSession.subscriberId },
    data: {
      name: sanitizePlainText(parsed.name),
      email: parsed.email.toLowerCase(),
      phone: customerSession.phone,
      deliveryPhone: cartRequiresAddress(lines)
        ? sanitizePlainText(parsed.deliveryPhone ?? parsed.phone ?? customerSession.phone)
        : undefined,
      ...subscriberCityUpdate(
        parsed.province ? sanitizePlainText(parsed.province) : null,
        parsed.city ? sanitizePlainText(parsed.city) : null,
      ),
      address: parsed.address ? sanitizePlainText(parsed.address) : null,
      planType: primaryPlan.slug,
      status: SubscriptionStatus.PENDING_PAYMENT,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      amount: payableAmount,
      type: PaymentType.SUBSCRIPTION,
      status: PaymentStatus.PENDING,
      gateway: 'zarinpal',
      subscriberId: subscriber.id,
      description,
      discountCode: appliedCode,
      discountAmount: discountAmount > 0 ? discountAmount : null,
      subtotalAmount: totals.amount,
    },
  });

  const callbackUrl = getPaymentCallbackUrl(resolved);
  const { authority } = await zarinpalRequestPayment({
    merchantId: resolved.zarinpal.merchantId,
    amount: payableAmount,
    callbackUrl: `${callbackUrl}?paymentId=${payment.id}`,
    description,
    sandbox: resolved.zarinpal.sandbox,
    email: parsed.email,
    mobile: customerSession.phone,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { transactionId: authority },
  });

  return {
    redirectUrl: zarinpalStartPayUrl(authority, resolved.zarinpal.sandbox),
  };
}

async function resolveCouponForCheckout(params: {
  code: string;
  subtotal: number;
  planSlugs: string[];
  subscriberId: string;
}): Promise<
  | {
      ok: true;
      amountOff: number;
      finalAmount: number;
      code: string;
      title: string;
      discountCodeId: string;
    }
  | { ok: false; message: string }
> {
  const code = normalizeDiscountCode(params.code);
  const row = await prisma.discountCode.findUnique({ where: { code } });
  if (!row) return { ok: false, message: 'کد تخفیف معتبر نیست.' };

  const userRedemptionCount = await prisma.discountRedemption.count({
    where: {
      discountCodeId: row.id,
      subscriberId: params.subscriberId,
      payment: { status: PaymentStatus.PAID },
    },
  });

  const candidate: CouponCandidate = {
    id: row.id,
    code: row.code,
    title: row.title,
    type: row.type,
    value: row.value,
    scope: row.scope,
    planSlugs: row.planSlugs,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    maxUsesPerUser: row.maxUsesPerUser,
    minSubtotal: row.minSubtotal,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    isActive: row.isActive,
    userRedemptionCount,
  };

  const applied = applyCouponToSubtotal({
    coupon: candidate,
    subtotal: params.subtotal,
    planSlugs: params.planSlugs,
  });
  if (!applied.ok) return applied;
  return { ...applied, discountCodeId: row.id };
}

export async function previewSubscriptionDiscountCode(input: {
  code: string;
  items: Array<{ planSlug: string; quantity: number }>;
}) {
  const customerSession = await requireCustomerSession();
  const code = normalizeDiscountCode(input.code ?? '');
  if (!code) throw new Error('کد تخفیف را وارد کنید.');

  const plans = await loadPlans();
  const lines = resolveSubscriptionCartLines(plans, input.items);
  if (lines.length === 0) throw new Error('سبد خرید خالی یا نامعتبر است.');
  const totals = sumSubscriptionCartTotals(lines);

  const result = await resolveCouponForCheckout({
    code,
    subtotal: totals.amount,
    planSlugs: lines.map((line) => line.plan.slug),
    subscriberId: customerSession.subscriberId,
  });
  if (!result.ok) throw new Error(result.message);

  return {
    code: result.code,
    title: result.title,
    amountOff: result.amountOff,
    subtotal: totals.amount,
    finalAmount: result.finalAmount,
  };
}

/** فقط برای نشست فعلی — دیگر با ایمیل عمومی قابل فراخوانی نیست */
export async function lookupSubscriberDashboard(): Promise<SubscriberDashboard | null> {
  await verifyCsrfFromRequest();
  return getSubscriberDashboardFromSession();
}

export async function getSubscriberDashboardFromSession(): Promise<SubscriberDashboard | null> {
  const { getCustomerSession } = await import('@/lib/customer-auth/session');
  const session = await getCustomerSession();
  if (!session) return null;

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: session.subscriberId },
    include: {
      payments: {
        where: { type: PaymentType.SUBSCRIPTION },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!subscriber) return null;

  const plans = await loadPlans();
  const planName = plans.find((p) => p.slug === subscriber.planType)?.name ?? subscriber.planType;

  return {
    id: subscriber.id,
    name: subscriber.name,
    email: subscriber.email,
    phone: subscriber.phone,
    deliveryPhone: subscriber.deliveryPhone,
    province: subscriber.province,
    city: subscriber.city,
    address: subscriber.address,
    status: subscriber.status,
    planType: subscriber.planType,
    planName,
    expiresAt: subscriber.expiresAt,
    payments: subscriber.payments.map((payment) => ({
      id: payment.id,
      date: payment.paidAt ?? payment.createdAt,
      amount: Number(payment.amount),
      plan: payment.description?.replace(/^SUBSCRIPTION:[^—]+ — /, '') ?? planName ?? '—',
      status:
        payment.status === PaymentStatus.PAID
          ? 'paid'
          : payment.status === PaymentStatus.PENDING
            ? 'pending'
            : 'failed',
    })),
  };
}
