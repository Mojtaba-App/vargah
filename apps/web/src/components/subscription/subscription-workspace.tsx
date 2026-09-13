'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { PaymentConfig } from '@vargah/business/payment-config';
import {
  PLAN_PERIOD_LABELS,
  PLAN_TYPE_LABELS,
  type SubscriptionPlanConfig,
} from '@vargah/business/subscription-plans';
import { isPaymentReady, resolvePaymentConfig } from '@vargah/business/payment-config';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';

import { initiateSubscriptionCheckout, previewSubscriptionDiscountCode } from '@/actions/subscription';
import { useCustomerAuth } from '@/components/auth/customer-auth-provider';
import { ProvinceCityField } from '@/components/forms/province-city-field';
import { PlanCard } from '@/components/subscription/plan-card';
import { useSubscriptionCart } from '@/components/subscription/subscription-cart-provider';
import { FormActionButton } from '@/components/shared/form-action-button';
import { isPlaceholderCustomerEmail } from '@/lib/customer-auth/phone';
import { formatPrice } from '@/lib/utils';
import { toPublicUserError } from '@/lib/forms/public-errors';

type SubscriptionWorkspaceProps = {
  plans: SubscriptionPlanConfig[];
  paymentConfig: PaymentConfig;
  paymentStatus?: string | null;
};

export function SubscriptionWorkspace({
  plans,
  paymentConfig,
  paymentStatus,
}: SubscriptionWorkspaceProps) {
  const { customer, isAuthenticated, openLogin } = useCustomerAuth();
  const {
    items,
    itemCount,
    totalAmount,
    addPlan,
    setQuantity,
    removeItem,
    clearCart,
    syncPricesFromPlans,
    setDrawerOpen,
  } = useSubscriptionCart();
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, startCheckout] = useTransition();
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    title: string;
    amountOff: number;
    finalAmount: number;
    subtotal: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isApplyingDiscount, startApplyDiscount] = useTransition();

  const paymentReady = isPaymentReady(resolvePaymentConfig(paymentConfig));
  const resolvedPayment = resolvePaymentConfig(paymentConfig);
  const paymentBlockReason =
    !resolvedPayment.enabled
      ? 'درگاه در پنل غیرفعال است'
      : !resolvedPayment.zarinpal.merchantId
        ? 'Merchant ID زرین‌پال در تنظیمات وارد نشده'
        : !resolvedPayment.callbackBaseUrl
          ? 'آدرس callback سایت تنظیم نشده'
          : null;

  const groupedPlans = useMemo(() => {
    const groups: Record<string, SubscriptionPlanConfig[]> = {
      digital: [],
      print: [],
      combo: [],
    };
    for (const plan of plans) groups[plan.type].push(plan);
    return groups;
  }, [plans]);

  const needsAddress = useMemo(
    () => items.some((item) => item.type === 'print' || item.type === 'combo'),
    [items],
  );

  const defaultEmail = useMemo(() => {
    if (customer && !isPlaceholderCustomerEmail(customer.email)) return customer.email;
    return '';
  }, [customer]);

  useEffect(() => {
    if (customer?.phone) setDeliveryPhone(customer.phone);
  }, [customer?.phone]);

  useEffect(() => {
    if (isAuthenticated) setAuthNotice(null);
  }, [isAuthenticated]);

  useEffect(() => {
    syncPricesFromPlans(plans);
  }, [plans, syncPricesFromPlans]);

  useEffect(() => {
    if (paymentStatus === 'success') clearCart();
  }, [paymentStatus, clearCart]);

  useEffect(() => {
    setAppliedDiscount(null);
    setDiscountError(null);
  }, [items]);

  const payableAmount = appliedDiscount?.finalAmount ?? totalAmount;

  const handleApplyDiscount = () => {
    setDiscountError(null);
    startApplyDiscount(async () => {
      try {
        const result = await previewSubscriptionDiscountCode({
          code: discountCodeInput,
          items: items.map((item) => ({
            planSlug: item.planSlug,
            quantity: item.quantity,
          })),
        });
        setAppliedDiscount(result);
        setDiscountCodeInput(result.code);
      } catch (error) {
        setAppliedDiscount(null);
        setDiscountError(toPublicUserError(error, 'اعمال کد تخفیف ناموفق بود'));
      }
    });
  };

  const handleAddToCart = (plan: SubscriptionPlanConfig, quantity: number) => {
    if (!isAuthenticated) {
      setAuthNotice('برای افزودن به سبد و خرید اشتراک، ابتدا با شماره موبایل وارد حساب کاربری شوید.');
      openLogin('subscription');
      return;
    }
    setAuthNotice(null);
    addPlan(plan, quantity);
  };

  const handleCheckout = (form: HTMLFormElement) => {
    if (items.length === 0) return;
    if (!isAuthenticated) {
      setAuthNotice('برای پرداخت اشتراک باید وارد حساب کاربری شوید.');
      openLogin('subscription');
      return;
    }

    setCheckoutError(null);
    const fd = new FormData(form);
    startCheckout(async () => {
      try {
        const result = await initiateSubscriptionCheckout({
          items: items.map((item) => ({
            planSlug: item.planSlug,
            quantity: item.quantity,
          })),
          name: String(fd.get('name') ?? ''),
          email: String(fd.get('email') ?? ''),
          phone: customer?.phone ?? String(fd.get('phone') ?? ''),
          deliveryPhone: needsAddress
            ? deliveryPhone || customer?.phone || String(fd.get('phone') ?? '')
            : undefined,
          province: String(fd.get('province') ?? ''),
          city: String(fd.get('city') ?? ''),
          address: String(fd.get('address') ?? ''),
          discountCode: appliedDiscount?.code,
        });
        window.location.href = result.redirectUrl;
      } catch (error) {
        if (error instanceof Error && error.message === 'LOGIN_REQUIRED') {
          setAuthNotice('برای پرداخت اشتراک باید وارد حساب کاربری شوید.');
          openLogin('subscription');
          return;
        }
        setCheckoutError(
          toPublicUserError(error, 'خطا در شروع پرداخت'),
        );
      }
    });
  };

  const cartQtyBySlug = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.planSlug, item.quantity);
    return map;
  }, [items]);

  return (
    <div className="space-y-16">
      {paymentStatus === 'success' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
          پرداخت با موفقیت انجام شد. اشتراک شما فعال شد. جزئیات در{' '}
          <a href="/profile?tab=payments" className="font-medium underline">
            پروفایل
          </a>{' '}
          قابل مشاهده است.
        </div>
      )}
      {paymentStatus === 'cancelled' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          پرداخت توسط شما لغو شد. می‌توانید دوباره تلاش کنید.
        </div>
      )}
      {(paymentStatus === 'failed' || paymentStatus === 'error') && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
          پرداخت ناموفق بود. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.
        </div>
      )}

      {!isAuthenticated && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm">
          برای خرید یا تمدید اشتراک،{' '}
          <button
            type="button"
            className="font-semibold text-primary underline-offset-2 hover:underline"
            onClick={() => openLogin('subscription')}
          >
            با موبایل وارد شوید
          </button>
          . وضعیت اشتراک و سوابق پرداخت در پروفایل کاربری مدیریت می‌شود.
        </div>
      )}

      {authNotice && (
        <p role="status" className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {authNotice}
        </p>
      )}

      <section>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">پلن‌های اشتراک</h2>
            <p className="mt-2 text-muted-foreground">
              قیمت‌ها از پنل مدیریت خوانده می‌شوند — چند پلن و تعداد دلخواه را به سبد اضافه کنید
              {paymentReady ? '' : ' (درگاه در حال راه‌اندازی)'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{plans.length} پلن فعال</Badge>
            <Badge variant={paymentReady ? 'default' : 'outline'}>
              {paymentReady ? 'پرداخت آنلاین فعال' : 'پرداخت آنلاین غیرفعال'}
            </Badge>
            {itemCount > 0 && (
              <button type="button" onClick={() => setDrawerOpen(true)}>
                <Badge variant="default">{itemCount} در سبد · {formatPrice(totalAmount)} ت</Badge>
              </button>
            )}
          </div>
        </div>

        {!paymentReady && paymentBlockReason && (
          <p className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            پلن‌ها قابل مشاهده و افزودن به سبد هستند. {paymentBlockReason} — تا زمان تکمیل، دکمه پرداخت غیرفعال می‌ماند.
          </p>
        )}

        {plans.length === 0 && (
          <p className="mb-6 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            هیچ پلن فعالی تعریف نشده است.
          </p>
        )}

        {(['digital', 'print', 'combo'] as const).map((type) =>
          groupedPlans[type].length > 0 ? (
            <div key={type} className="mb-10">
              <h3 className="mb-4 text-lg font-semibold">{PLAN_TYPE_LABELS[type]}</h3>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {groupedPlans[type].map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    inCartQuantity={cartQtyBySlug.get(plan.slug) ?? 0}
                    checkoutReady={paymentReady}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </div>
          ) : null,
        )}
      </section>

      {items.length > 0 && isAuthenticated && (
        <section
          id="checkout"
          className="scroll-mt-28 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-6 md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-primary">سبد خرید اشتراک</p>
              <h3 className="text-xl font-bold">{itemCount} مورد · {formatPrice(totalAmount)} تومان</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                مبلغ نهایی بر اساس قیمت به‌روز پنل محاسبه می‌شود
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={clearCart}>
              خالی کردن سبد
            </Button>
          </div>

          <ul className="mb-6 space-y-3">
            {items.map((item) => (
              <li
                key={item.planSlug}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/70 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {PLAN_TYPE_LABELS[item.type]} · {PLAN_PERIOD_LABELS[item.period]} ·{' '}
                    {formatPrice(item.unitPrice)} تومان
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-lg border border-border">
                    <button
                      type="button"
                      className="px-2.5 py-1 text-sm"
                      onClick={() => setQuantity(item.planSlug, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="min-w-7 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-sm"
                      onClick={() => setQuantity(item.planSlug, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="min-w-24 text-end text-sm font-bold tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => removeItem(item.planSlug)}
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheckout(e.currentTarget);
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="checkout-name">نام و نام خانوادگی</Label>
              <Input id="checkout-name" name="name" required defaultValue={customer?.name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-email">ایمیل</Label>
              <Input
                id="checkout-email"
                name="email"
                type="email"
                required
                defaultValue={defaultEmail}
                dir="ltr"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="checkout-phone">موبایل حساب (ورود)</Label>
              <Input
                id="checkout-phone"
                name="phone"
                required
                value={customer?.phone ?? ''}
                readOnly
                dir="ltr"
                className="rounded-xl bg-muted/40"
              />
            </div>

            {needsAddress && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="checkout-delivery-phone">تلفن تماس برای ارسال</Label>
                  <Input
                    id="checkout-delivery-phone"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="09xxxxxxxxx"
                    className="rounded-xl"
                  />
                </div>
                <div className="md:col-span-2">
                  <ProvinceCityField
                    province={province}
                    city={city}
                    onProvinceChange={setProvince}
                    onCityChange={setCity}
                    disabled={isCheckingOut}
                    provinceId="province"
                    cityId="city"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="checkout-address">آدرس کامل پستی</Label>
                  <Textarea id="checkout-address" name="address" required rows={3} className="rounded-xl" />
                </div>
              </>
            )}

            <div className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-background/80 p-4 md:col-span-2">
              <div>
                <Label htmlFor="discount-code">کد تخفیف</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  اگر کد تخفیف دارید، قبل از پرداخت وارد کنید
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="discount-code"
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                  placeholder="مثلاً WELCOME20"
                  className="rounded-xl font-mono uppercase"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl sm:shrink-0"
                  disabled={isApplyingDiscount || !discountCodeInput.trim()}
                  onClick={handleApplyDiscount}
                >
                  {isApplyingDiscount ? 'در حال بررسی...' : 'اعمال کد'}
                </Button>
                {appliedDiscount && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl text-destructive sm:shrink-0"
                    onClick={() => {
                      setAppliedDiscount(null);
                      setDiscountCodeInput('');
                      setDiscountError(null);
                    }}
                  >
                    حذف کد
                  </Button>
                )}
              </div>
              {discountError && <p className="text-sm text-destructive">{discountError}</p>}
              {appliedDiscount && (
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                  کد <span className="font-mono font-bold">{appliedDiscount.code}</span> (
                  {appliedDiscount.title}) اعمال شد —{' '}
                  {formatPrice(appliedDiscount.amountOff)} تومان تخفیف
                </div>
              )}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <span>جمع سبد</span>
                  <span className="tabular-nums">{formatPrice(totalAmount)} تومان</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between gap-3 text-emerald-700 dark:text-emerald-300">
                    <span>تخفیف کد</span>
                    <span className="tabular-nums">−{formatPrice(appliedDiscount.amountOff)} تومان</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 border-t border-border pt-2 font-bold">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="tabular-nums text-primary">{formatPrice(payableAmount)} تومان</span>
                </div>
              </div>
            </div>

            {checkoutError && (
              <p className="md:col-span-2 text-sm text-destructive">{checkoutError}</p>
            )}

            <div className="md:col-span-2">
              {!paymentReady ? (
                <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  برای پرداخت آنلاین، در پنل «تنظیمات → پرداخت و اشتراک» درگاه زرین‌پال را کامل کنید.
                </p>
              ) : null}
              <FormActionButton
                type="submit"
                disabled={!paymentReady}
                loading={isCheckingOut}
                loadingText="در حال انتقال به درگاه..."
                className="mt-3 px-8"
              >
                پرداخت {formatPrice(payableAmount)} تومان با زرین‌پال
              </FormActionButton>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
