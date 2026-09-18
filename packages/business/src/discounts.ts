import type { SubscriptionPlanConfig } from './subscription-plans';
import type { PlanSaleDiscountType } from './subscription-plans';

export type { PlanSaleDiscountType };

/** قیمت لیست (قبل از تخفیف محصول) */
export function getPlanListPrice(plan: Pick<SubscriptionPlanConfig, 'price'>): number {
  return Math.max(0, Math.floor(Number(plan.price) || 0));
}

/** مبلغ تخفیف محصول روی یک واحد */
export function getPlanUnitDiscount(
  plan: Pick<SubscriptionPlanConfig, 'price' | 'discountType' | 'discountValue'>,
): number {
  const list = getPlanListPrice(plan);
  const type = plan.discountType ?? 'none';
  const value = Math.max(0, Math.floor(Number(plan.discountValue) || 0));
  if (type === 'none' || value <= 0 || list <= 0) return 0;
  if (type === 'percent') {
    const pct = Math.min(100, value);
    return Math.min(list, Math.floor((list * pct) / 100));
  }
  return Math.min(list, value);
}

/** قیمت واحد پس از تخفیف محصول */
export function getPlanSalePrice(
  plan: Pick<SubscriptionPlanConfig, 'price' | 'discountType' | 'discountValue'>,
): number {
  return Math.max(0, getPlanListPrice(plan) - getPlanUnitDiscount(plan));
}

export function planHasSaleDiscount(
  plan: Pick<SubscriptionPlanConfig, 'price' | 'discountType' | 'discountValue'>,
): boolean {
  return getPlanUnitDiscount(plan) > 0;
}

export function getPlanDiscountBadgeLabel(
  plan: Pick<SubscriptionPlanConfig, 'discountType' | 'discountValue'>,
): string | null {
  const type = plan.discountType ?? 'none';
  const value = Math.max(0, Math.floor(Number(plan.discountValue) || 0));
  if (type === 'percent' && value > 0) return `${value}٪ تخفیف`;
  if (type === 'fixed' && value > 0) return 'تخفیف ویژه';
  return null;
}

export type CouponDiscountType = 'PERCENT' | 'FIXED';
export type CouponDiscountScope = 'ALL' | 'SELECTED';

export type CouponCandidate = {
  id: string;
  code: string;
  title: string;
  type: CouponDiscountType;
  value: number;
  scope: CouponDiscountScope;
  planSlugs: string[];
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  minSubtotal: number | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  isActive: boolean;
  userRedemptionCount?: number;
};

export type CouponApplyInput = {
  coupon: CouponCandidate;
  /** جمع سبد پس از تخفیف محصول */
  subtotal: number;
  /** اسلاگ‌های پلن‌های داخل سبد */
  planSlugs: string[];
  now?: Date;
};

export type CouponApplyResult =
  | { ok: true; amountOff: number; finalAmount: number; code: string; title: string }
  | { ok: false; message: string };

export function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function applyCouponToSubtotal(input: CouponApplyInput): CouponApplyResult {
  const { coupon, subtotal, planSlugs } = input;
  const now = input.now ?? new Date();
  const code = normalizeDiscountCode(coupon.code);

  if (!coupon.isActive) {
    return { ok: false, message: 'این کد تخفیف غیرفعال است.' };
  }
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return { ok: false, message: 'زمان شروع این کد تخفیف هنوز نرسیده است.' };
  }
  if (coupon.endsAt && new Date(coupon.endsAt) < now) {
    return { ok: false, message: 'مهلت این کد تخفیف به پایان رسیده است.' };
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, message: 'سقف استفاده از این کد تکمیل شده است.' };
  }
  if (coupon.maxUsesPerUser != null && (coupon.userRedemptionCount ?? 0) >= coupon.maxUsesPerUser) {
    return { ok: false, message: 'شما قبلاً از این کد به سقف مجاز استفاده کرده‌اید.' };
  }
  if (coupon.minSubtotal != null && subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      message: `حداقل مبلغ سفارش برای این کد ${coupon.minSubtotal.toLocaleString('fa-IR')} تومان است.`,
    };
  }
  if (coupon.scope === 'SELECTED') {
    const allowed = new Set(coupon.planSlugs.map((s) => s.trim()).filter(Boolean));
    if (allowed.size === 0 || !planSlugs.some((slug) => allowed.has(slug))) {
      return { ok: false, message: 'این کد برای محصولات سبد شما قابل استفاده نیست.' };
    }
  }
  if (subtotal <= 0) {
    return { ok: false, message: 'مبلغ سبد برای اعمال تخفیف کافی نیست.' };
  }

  const value = Math.max(0, Math.floor(Number(coupon.value) || 0));
  let amountOff = 0;
  if (coupon.type === 'PERCENT') {
    amountOff = Math.min(subtotal, Math.floor((subtotal * Math.min(100, value)) / 100));
  } else {
    amountOff = Math.min(subtotal, value);
  }

  if (amountOff <= 0) {
    return { ok: false, message: 'مبلغ تخفیف این کد معتبر نیست.' };
  }

  return {
    ok: true,
    amountOff,
    finalAmount: Math.max(0, subtotal - amountOff),
    code,
    title: coupon.title,
  };
}
