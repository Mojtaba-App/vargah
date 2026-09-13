'use client';

import { Link } from '@/i18n/navigation';
import { PLAN_PERIOD_LABELS, PLAN_TYPE_LABELS } from '@vargah/business/subscription-plans';
import { SUBSCRIPTION_CART_TTL_DAYS } from '@vargah/business/subscription-cart';
import { Button } from '@vargah/ui/components/button';

import { useSubscriptionCart } from '@/components/subscription/subscription-cart-provider';
import { cn, formatPrice } from '@/lib/utils';

export function SubscriptionCartDrawer() {
  const {
    items,
    itemCount,
    totalAmount,
    drawerOpen,
    setDrawerOpen,
    setQuantity,
    removeItem,
    clearCart,
  } = useSubscriptionCart();

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="سبد اشتراک">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="بستن سبد"
        onClick={() => setDrawerOpen(false)}
      />
      <aside className="absolute inset-y-0 end-0 flex w-[min(100%,24rem)] flex-col border-s border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div>
            <h2 className="text-base font-bold">سبد اشتراک</h2>
            <p className="text-xs text-muted-foreground">{itemCount} مورد</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            بستن
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              سبد خالی است. یک پلن اشتراک اضافه کنید.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.planSlug} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {PLAN_TYPE_LABELS[item.type]} · {PLAN_PERIOD_LABELS[item.period]}
                    </p>
                    <p className="mt-1 text-sm tabular-nums">
                      {formatPrice(item.unitPrice)} تومان
                      <span className="text-muted-foreground"> / واحد</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.planSlug)}
                    className="text-xs text-destructive hover:underline"
                  >
                    حذف
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-lg border border-border">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-sm"
                      onClick={() => setQuantity(item.planSlug, item.quantity - 1)}
                      aria-label="کاهش تعداد"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-sm"
                      onClick={() => setQuantity(item.planSlug, item.quantity + 1)}
                      aria-label="افزایش تعداد"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-bold tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity)} تومان
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t border-border p-4">
          {items.length > 0 && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              اقلام سبد تا {SUBSCRIPTION_CART_TTL_DAYS} روز نگهداری می‌شوند و پس از آن به‌صورت خودکار حذف
              می‌گردند.
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">جمع سبد</span>
            <span className="font-bold tabular-nums">{formatPrice(totalAmount)} تومان</span>
          </div>
          <div className="flex gap-2">
            {items.length > 0 && (
              <Button type="button" variant="outline" className="rounded-xl" onClick={clearCart}>
                خالی کردن
              </Button>
            )}
            <Link
              href="/subscription#checkout"
              className="flex-1"
              onClick={() => setDrawerOpen(false)}
            >
              <Button type="button" className={cn('w-full rounded-xl')} disabled={items.length === 0}>
                ادامه خرید
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
