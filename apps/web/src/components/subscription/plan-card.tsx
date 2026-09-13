'use client';

import { useState } from 'react';
import {
  PLAN_PERIOD_LABELS,
  PLAN_TYPE_LABELS,
  type SubscriptionPlanConfig,
} from '@vargah/business/subscription-plans';
import {
  getPlanDiscountBadgeLabel,
  getPlanListPrice,
  getPlanSalePrice,
  planHasSaleDiscount,
} from '@vargah/business/discounts';
import { SUBSCRIPTION_CART_MAX_QTY } from '@vargah/business/subscription-cart';
import { cn, formatPrice } from '@/lib/utils';

type PlanCardProps = {
  plan: SubscriptionPlanConfig;
  inCartQuantity?: number;
  checkoutReady?: boolean;
  onAddToCart?: (plan: SubscriptionPlanConfig, quantity: number) => void;
};

export function PlanCard({
  plan,
  inCartQuantity = 0,
  checkoutReady = false,
  onAddToCart,
}: PlanCardProps) {
  const [quantity, setQuantity] = useState(1);
  const periodLabel = PLAN_PERIOD_LABELS[plan.period];
  const listPrice = getPlanListPrice(plan);
  const salePrice = getPlanSalePrice(plan);
  const onSale = planHasSaleDiscount(plan);
  const discountLabel = getPlanDiscountBadgeLabel(plan);
  const lineTotal = salePrice * quantity;

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg',
        plan.popular && 'border-primary/40 ring-1 ring-primary/15',
        inCartQuantity > 0 && 'border-primary ring-2 ring-primary/20 shadow-lg',
        onSale && 'border-rose-300/50 dark:border-rose-500/30',
      )}
    >
      {plan.popular && (
        <span className="absolute -top-3 start-4 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
          پرطرفدار
        </span>
      )}
      {discountLabel && (
        <span className="absolute -top-3 end-4 rounded-full bg-rose-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
          {discountLabel}
        </span>
      )}

      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {PLAN_TYPE_LABELS[plan.type]}
        </span>
        <span className="text-xs text-muted-foreground">{periodLabel}</span>
        {inCartQuantity > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {inCartQuantity} در سبد
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold">{plan.name}</h3>
      <div className="mt-3">
        {onSale ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground line-through decoration-rose-400/80 tabular-nums">
              {formatPrice(listPrice)} تومان
            </p>
            <p>
              <span className="text-3xl font-bold tabular-nums text-rose-700 dark:text-rose-300">
                {formatPrice(salePrice)}
              </span>
              <span className="text-sm text-muted-foreground"> تومان / واحد</span>
            </p>
          </div>
        ) : (
          <p>
            <span className="text-3xl font-bold tabular-nums">{formatPrice(listPrice)}</span>
            <span className="text-sm text-muted-foreground"> تومان / واحد</span>
          </p>
        )}
      </div>

      <ul className="my-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-primary">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">تعداد</span>
        <div className="inline-flex items-center rounded-lg border border-border">
          <button
            type="button"
            className="px-2.5 py-1.5 text-sm"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="کاهش تعداد"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            className="px-2.5 py-1.5 text-sm"
            onClick={() => setQuantity((q) => Math.min(SUBSCRIPTION_CART_MAX_QTY, q + 1))}
            aria-label="افزایش تعداد"
          >
            +
          </button>
        </div>
      </div>

      <p className="mb-3 text-center text-sm text-muted-foreground">
        جمع این انتخاب:{' '}
        <span className="font-semibold text-foreground tabular-nums">{formatPrice(lineTotal)}</span>{' '}
        تومان
      </p>

      {!checkoutReady && (
        <p className="mb-3 text-center text-xs text-muted-foreground">پرداخت پس از فعال‌سازی درگاه</p>
      )}

      <button
        type="button"
        onClick={() => onAddToCart?.(plan, quantity)}
        className="h-11 rounded-xl bg-primary font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        افزودن به سبد
      </button>
    </article>
  );
}
