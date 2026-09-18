'use client';

import { Link } from '@/i18n/navigation';
import { PLAN_PERIOD_LABELS, PLAN_TYPE_LABELS } from '@vargah/business/subscription-plans';
import { SUBSCRIPTION_CART_TTL_DAYS } from '@vargah/business/subscription-cart';
import { Button } from '@vargah/ui/components/button';
import { Card } from '@vargah/ui/components/card';
import { FormActionButton } from '@/components/shared/form-action-button';
import { useSubscriptionCart } from '@/components/subscription/subscription-cart-provider';
import { formatJalaliDate } from '@/lib/date';
import { cn, formatPrice } from '@/lib/utils';

type PaymentRecord = {
  id: string;
  date: Date | string;
  amount: number;
  plan: string;
  status: 'paid' | 'pending' | 'failed';
};

type SubscriptionSummary = {
  statusLabel: string;
  planName: string | null;
  expiresAt: Date | string | null;
  showExpiredNotice: boolean;
  showPendingNotice: boolean;
};

type ProfilePurchaseHistoryProps = {
  payments: PaymentRecord[];
  subscription: SubscriptionSummary;
};

const STATUS_STYLES = {
  paid: {
    badge:
      'border border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100',
    label: 'پرداخت‌شده',
  },
  pending: {
    badge:
      'border border-sky-400 bg-sky-100 text-sky-950 dark:border-sky-400/50 dark:bg-sky-500/25 dark:text-sky-50',
    label: 'در انتظار',
  },
  failed: {
    badge:
      'border border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-100',
    label: 'ناموفق',
  },
  cart: {
    badge:
      'border border-violet-400 bg-violet-100 text-violet-950 dark:border-violet-400/50 dark:bg-violet-500/25 dark:text-violet-50',
    label: 'سبد باز',
  },
} as const;

export function ProfilePurchaseHistory({ payments, subscription }: ProfilePurchaseHistoryProps) {
  const { items, itemCount, totalAmount, clearCart, setDrawerOpen } = useSubscriptionCart();

  const history = payments
    .filter((p) => p.status !== 'pending')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const paidTotal = history
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const hasOpenCart = items.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">اشتراک و سوابق خرید</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          وضعیت اشتراک فعلی و تاریخچه پرداخت‌های شما
        </p>
      </div>

      <Card className="border-primary/15 from-primary/8 via-background to-background overflow-hidden bg-gradient-to-br">
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="وضعیت اشتراک" value={subscription.statusLabel} highlight />
          <SummaryItem label="پلن فعلی" value={subscription.planName ?? 'بدون اشتراک'} />
          <SummaryItem
            label="تاریخ انقضا"
            value={
              subscription.expiresAt ? formatJalaliDate(subscription.expiresAt, 'D MMMM YYYY') : '—'
            }
          />
          <SummaryItem label="مجموع پرداخت‌های موفق" value={`${formatPrice(paidTotal)} تومان`} />
        </div>
        {(subscription.showExpiredNotice || subscription.showPendingNotice) && (
          <div className="border-border/70 border-t bg-sky-50/80 px-5 py-3 text-sm dark:bg-sky-950/25">
            {subscription.showExpiredNotice
              ? 'اشتراک شما منقضی شده است.'
              : 'پرداخت اشتراک در انتظار تأیید است.'}{' '}
            <Link
              href="/subscription"
              className="text-primary font-semibold underline-offset-2 hover:underline"
            >
              تمدید یا خرید اشتراک
            </Link>
          </div>
        )}
      </Card>

      {hasOpenCart && (
        <Card className="via-background to-background relative overflow-hidden border-violet-500/25 bg-gradient-to-br from-violet-500/8 p-4 sm:p-5">
          <div className="absolute inset-y-0 start-0 w-1 bg-violet-500/70" aria-hidden="true" />
          <div className="flex flex-col gap-4 ps-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">سبد خرید اشتراک</p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    STATUS_STYLES.cart.badge,
                  )}
                >
                  {STATUS_STYLES.cart.label}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    STATUS_STYLES.pending.badge,
                  )}
                >
                  {STATUS_STYLES.pending.label}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {itemCount} مورد · نگهداری تا {SUBSCRIPTION_CART_TTL_DAYS} روز · پس از حذف از این
                فهرست پاک می‌شود
              </p>
              <ul className="space-y-1.5 text-sm">
                {items.map((item) => (
                  <li
                    key={item.planSlug}
                    className="flex flex-wrap items-baseline justify-between gap-2"
                  >
                    <span>
                      {item.name}
                      <span className="text-muted-foreground ms-1 text-xs">
                        ({PLAN_TYPE_LABELS[item.type]} · {PLAN_PERIOD_LABELS[item.period]}) ×{' '}
                        {item.quantity}
                      </span>
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatPrice(item.unitPrice * item.quantity)} تومان
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <p className="text-lg font-bold tabular-nums">{formatPrice(totalAmount)} تومان</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setDrawerOpen(true)}
                >
                  مشاهده سبد
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={clearCart}
                >
                  حذف سبد
                </Button>
                <Link href="/subscription#checkout">
                  <Button type="button" size="sm" className="rounded-xl">
                    ادامه و نهایی کردن
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {history.length === 0 && !hasOpenCart ? (
        <Card className="border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">هنوز خرید یا پرداختی ثبت نشده است.</p>
          <Link href="/subscription" className="mt-4 inline-block">
            <FormActionButton type="button">مشاهده پلن‌های اشتراک</FormActionButton>
          </Link>
        </Card>
      ) : history.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">فهرست خریدها ({history.length})</h3>
          </div>
          <div className="space-y-3">
            {history.map((payment, index) => {
              const style = STATUS_STYLES[payment.status];
              return (
                <Card
                  key={payment.id}
                  className="relative overflow-hidden p-4 transition-shadow hover:shadow-md sm:p-5"
                >
                  <div
                    className="bg-primary/70 absolute inset-y-0 start-0 w-1"
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 ps-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{payment.plan}</p>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            style.badge,
                          )}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatJalaliDate(payment.date, 'dddd D MMMM YYYY — HH:mm')}
                      </p>
                      {index === 0 && payment.status === 'paid' && (
                        <p className="text-primary mt-2 text-xs">آخرین خرید موفق</p>
                      )}
                    </div>
                    <div className="ps-2 text-start sm:text-end">
                      <p className="text-lg font-bold tabular-nums">
                        {formatPrice(payment.amount)}
                      </p>
                      <p className="text-muted-foreground text-xs">تومان</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="border-border/60 bg-background/70 rounded-xl border px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn('mt-1 text-sm font-bold', highlight && 'text-primary')}>{value}</p>
    </div>
  );
}
