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
        'border-border bg-background relative flex flex-col rounded-2xl border p-6 transition-all hover:shadow-lg',
        plan.popular && 'border-primary/40 ring-primary/15 ring-1',
        inCartQuantity > 0 && 'border-primary ring-primary/20 shadow-lg ring-2',
        onSale && 'border-rose-300/50 dark:border-rose-500/30',
      )}
    >
      {plan.popular && (
        <span className="bg-primary text-primary-foreground absolute start-4 -top-3 rounded-full px-3 py-0.5 text-xs font-medium">
          پرطرفدار
        </span>
      )}
      {discountLabel && (
        <span className="absolute end-4 -top-3 rounded-full bg-rose-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
          {discountLabel}
        </span>
      )}

      <div className="mb-3 flex items-center gap-2">
        <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs font-medium">
          {PLAN_TYPE_LABELS[plan.type]}
        </span>
        <span className="text-muted-foreground text-xs">{periodLabel}</span>
        {inCartQuantity > 0 && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            {inCartQuantity} در سبد
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold">{plan.name}</h3>
      <div className="mt-3">
        {onSale ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm tabular-nums line-through decoration-rose-400/80">
              {formatPrice(listPrice)} تومان
            </p>
            <p>
              <span className="text-3xl font-bold text-rose-700 tabular-nums dark:text-rose-300">
                {formatPrice(salePrice)}
              </span>
              <span className="text-muted-foreground text-sm"> تومان / واحد</span>
            </p>
          </div>
        ) : (
          <p>
            <span className="text-3xl font-bold tabular-nums">{formatPrice(listPrice)}</span>
            <span className="text-muted-foreground text-sm"> تومان / واحد</span>
          </p>
        )}
      </div>

      <ul className="my-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <span className="text-primary mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs">تعداد</span>
        <div className="border-border inline-flex items-center rounded-lg border">
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

      <p className="text-muted-foreground mb-3 text-center text-sm">
        جمع این انتخاب:{' '}
        <span className="text-foreground font-semibold tabular-nums">{formatPrice(lineTotal)}</span>{' '}
        تومان
      </p>

      {!checkoutReady && (
        <p className="text-muted-foreground mb-3 text-center text-xs">
          پرداخت پس از فعال‌سازی درگاه
        </p>
      )}

      <button
        type="button"
        onClick={() => onAddToCart?.(plan, quantity)}
        className="bg-primary text-primary-foreground h-11 rounded-xl font-medium transition-colors hover:opacity-90"
      >
        افزودن به سبد
      </button>
    </article>
  );
}
