'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  PLAN_PERIOD_LABELS,
  PLAN_TYPE_LABELS,
  type PlanSaleDiscountType,
  type SubscriptionPlanConfig,
  type SubscriptionPlanPeriod,
  type SubscriptionPlanType,
} from '@vargah/business/subscription-plans';
import { getPlanSalePrice, planHasSaleDiscount } from '@vargah/business/discounts';
import { Input, Label } from '@vargah/ui/components/input';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';

import { updateSubscriptionPlans } from '@/actions/settings';
import { isNextRedirect } from '@/lib/action-state';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { getActionErrorMessage } from '@/lib/settings/errors';
import { cn, formatPrice } from '@/lib/utils';

type SubscriptionPlansManagerProps = {
  initialPlans: SubscriptionPlanConfig[];
  canEdit: boolean;
};

type PlanFeedback = {
  type: 'success' | 'error';
  message: string;
};

function emptyPlan(sortOrder: number): SubscriptionPlanConfig {
  return {
    id: `plan-new-${Date.now()}`,
    slug: '',
    name: '',
    type: 'digital',
    price: 0,
    discountType: 'none',
    discountValue: 0,
    period: 'monthly',
    periodMonths: 1,
    features: [''],
    isActive: true,
    sortOrder,
  };
}

function normalizePlans(plans: SubscriptionPlanConfig[]): SubscriptionPlanConfig[] {
  return plans.map((plan, index) => ({
    ...plan,
    slug: plan.slug.trim(),
    name: plan.name.trim(),
    sortOrder: index + 1,
    features: plan.features.map((f) => f.trim()).filter(Boolean),
    periodMonths: plan.period === 'yearly' ? 12 : 1,
    discountType: plan.discountType ?? 'none',
    discountValue:
      plan.discountType === 'none' || !plan.discountType ? 0 : (plan.discountValue ?? 0),
  }));
}

function validatePlan(plan: SubscriptionPlanConfig): string | null {
  if (plan.name.trim().length < 2) return 'نام پلن حداقل ۲ کاراکتر باشد';
  if (plan.slug.trim().length < 2) return 'Slug حداقل ۲ کاراکتر باشد';
  if (!/^[a-z0-9-]+$/.test(plan.slug.trim())) {
    return 'Slug فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد';
  }
  if (!Number.isInteger(plan.price) || plan.price < 0) return 'قیمت باید عدد صحیح و غیرمنفی باشد';
  if ((plan.discountType ?? 'none') === 'percent') {
    const value = plan.discountValue ?? 0;
    if (value < 0 || value > 100) return 'درصد تخفیف باید بین ۰ تا ۱۰۰ باشد';
  }
  if ((plan.discountType ?? 'none') === 'fixed') {
    const value = plan.discountValue ?? 0;
    if (value < 0) return 'مبلغ تخفیف نمی‌تواند منفی باشد';
    if (value > plan.price) return 'مبلغ تخفیف نمی‌تواند بیشتر از قیمت باشد';
  }
  return null;
}

function findFirstInvalidPlan(
  plans: SubscriptionPlanConfig[],
  exceptId?: string,
): { plan: SubscriptionPlanConfig; message: string } | null {
  for (const plan of plans) {
    if (exceptId && plan.id === exceptId) continue;
    const message = validatePlan(plan);
    if (message) return { plan, message };
  }
  return null;
}

export function SubscriptionPlansManager({ initialPlans, canEdit }: SubscriptionPlansManagerProps) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [feedbackById, setFeedbackById] = useState<Record<string, PlanFeedback | undefined>>({});
  const [listFeedback, setListFeedback] = useState<PlanFeedback | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [, startSave] = useTransition();

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setPlanFeedback = (id: string, feedback: PlanFeedback | undefined) => {
    setFeedbackById((prev) => {
      if (!feedback) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: feedback };
    });
  };

  const updatePlan = (index: number, patch: Partial<SubscriptionPlanConfig>) => {
    const planId = plans[index]?.id;
    if (planId) setPlanFeedback(planId, undefined);
    setPlans((prev) =>
      prev.map((plan, i) => {
        if (i !== index) return plan;
        const next = { ...plan, ...patch };
        if (patch.period === 'monthly') next.periodMonths = 1;
        if (patch.period === 'yearly') next.periodMonths = 12;
        return next;
      }),
    );
  };

  const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
    const planId = plans[planIndex]?.id;
    if (planId) setPlanFeedback(planId, undefined);
    setPlans((prev) =>
      prev.map((plan, i) => {
        if (i !== planIndex) return plan;
        const features = [...plan.features];
        features[featureIndex] = value;
        return { ...plan, features };
      }),
    );
  };

  const addFeature = (planIndex: number) => {
    setPlans((prev) =>
      prev.map((plan, i) =>
        i === planIndex ? { ...plan, features: [...plan.features, ''] } : plan,
      ),
    );
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setPlans((prev) =>
      prev.map((plan, i) => {
        if (i !== planIndex) return plan;
        const features = plan.features.filter((_, fi) => fi !== featureIndex);
        return { ...plan, features: features.length ? features : [''] };
      }),
    );
  };

  const addPlan = () => {
    const plan = emptyPlan(plans.length + 1);
    setPlans((prev) => [...prev, plan]);
    setOpenIds((prev) => new Set(prev).add(plan.id));
  };

  const persistPlans = (
    nextPlans: SubscriptionPlanConfig[],
    options: {
      focusId?: string;
      successMessage: string;
      listLevel?: boolean;
    },
  ) => {
    const { focusId, successMessage, listLevel } = options;
    const focusPlan = focusId ? nextPlans.find((p) => p.id === focusId) : undefined;

    if (focusPlan) {
      const validationError = validatePlan(focusPlan);
      if (validationError) {
        setPlanFeedback(focusPlan.id, { type: 'error', message: validationError });
        setOpenIds((prev) => new Set(prev).add(focusPlan.id));
        return;
      }
    }

    const otherInvalid = findFirstInvalidPlan(nextPlans, focusId);
    if (otherInvalid) {
      const label = otherInvalid.plan.name.trim() || otherInvalid.plan.slug || 'دیگر';
      const message = `پلن «${label}» ناقص است: ${otherInvalid.message}`;
      if (listLevel) setListFeedback({ type: 'error', message });
      else if (focusId) {
        setPlanFeedback(focusId, { type: 'error', message });
        setOpenIds((prev) => new Set(prev).add(otherInvalid.plan.id).add(focusId));
      }
      return;
    }

    const slugCounts = new Map<string, number>();
    for (const plan of nextPlans) {
      const slug = plan.slug.trim().toLowerCase();
      slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
    }
    for (const plan of nextPlans) {
      if ((slugCounts.get(plan.slug.trim().toLowerCase()) ?? 0) > 1) {
        const targetId = focusId ?? plan.id;
        if (listLevel) {
          setListFeedback({ type: 'error', message: 'Slug همه پلن‌ها باید یکتا باشد' });
        } else {
          setPlanFeedback(targetId, { type: 'error', message: 'Slug باید یکتا باشد' });
          setOpenIds((prev) => new Set(prev).add(targetId));
        }
        return;
      }
    }

    const savingKey = focusId ?? '__list__';
    setSavingId(savingKey);
    if (focusId) setPlanFeedback(focusId, undefined);
    if (listLevel) setListFeedback(null);

    startSave(async () => {
      try {
        const normalized = normalizePlans(nextPlans);
        await updateSubscriptionPlans(normalized);
        setPlans(normalized);
        if (listLevel) {
          setListFeedback({ type: 'success', message: successMessage });
        } else if (focusId) {
          setPlanFeedback(focusId, { type: 'success', message: successMessage });
        }
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        const message = getActionErrorMessage(err);
        if (listLevel) setListFeedback({ type: 'error', message });
        else if (focusId) setPlanFeedback(focusId, { type: 'error', message });
      } finally {
        setSavingId(null);
      }
    });
  };

  const handleSavePlan = (index: number) => {
    const plan = plans[index];
    if (!plan) return;
    const label = plan.name.trim() || 'پلن';
    persistPlans(plans, {
      focusId: plan.id,
      successMessage: `پلن «${label}» ذخیره شد`,
    });
  };

  const handleDeletePlan = (index: number) => {
    const plan = plans[index];
    if (!plan || plans.length <= 1) return;
    const nextPlans = plans.filter((_, i) => i !== index);
    setPlans(nextPlans);
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.delete(plan.id);
      return next;
    });
    setFeedbackById((prev) => {
      const { [plan.id]: _, ...rest } = prev;
      return rest;
    });
    persistPlans(nextPlans, {
      listLevel: true,
      successMessage: `پلن «${plan.name.trim() || plan.slug || 'حذف‌شده'}» حذف و ذخیره شد`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">پلن‌های اشتراک</h3>
          <p className="text-muted-foreground text-sm">
            پلن‌های فعال در صفحه اشتراک سایت نمایش داده می‌شوند. برای ویرایش روی هر پلن کلیک کنید.
          </p>
        </div>
        {canEdit && (
          <Button type="button" variant="outline" className="rounded-xl" onClick={addPlan}>
            + پلن جدید
          </Button>
        )}
      </div>

      {listFeedback && (
        <StatusBanner
          type={listFeedback.type}
          message={listFeedback.message}
          onDismiss={listFeedback.type === 'success' ? () => setListFeedback(null) : undefined}
        />
      )}

      <div className="space-y-3">
        {plans.map((plan, index) => {
          const open = openIds.has(plan.id);
          const feedback = feedbackById[plan.id];
          const isSaving = savingId === plan.id;
          const title = plan.name.trim() || 'پلن بدون نام';

          return (
            <div
              key={plan.id}
              className={cn(
                'border-border bg-card overflow-hidden rounded-2xl border transition-shadow',
                open && 'ring-primary/15 shadow-sm ring-1',
              )}
            >
              <button
                type="button"
                onClick={() => toggleOpen(plan.id)}
                aria-expanded={open}
                className="hover:bg-muted/40 flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors"
              >
                <span
                  className={cn(
                    'border-border bg-muted/40 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg border transition-transform',
                    open && 'bg-primary/10 text-primary rotate-180',
                  )}
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{title}</span>
                    <Badge variant={plan.isActive ? 'default' : 'outline'}>
                      {plan.isActive ? 'فعال' : 'غیرفعال'}
                    </Badge>
                    <Badge variant="secondary">{PLAN_TYPE_LABELS[plan.type]}</Badge>
                    <Badge variant="outline">{PLAN_PERIOD_LABELS[plan.period]}</Badge>
                    {plan.popular && <Badge>پرطرفدار</Badge>}
                  </div>
                  {plan.slug ? (
                    <p
                      className="text-muted-foreground mt-0.5 truncate font-mono text-xs"
                      dir="ltr"
                    >
                      {plan.slug}
                    </p>
                  ) : null}
                </div>

                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatPrice(planHasSaleDiscount(plan) ? getPlanSalePrice(plan) : plan.price)}{' '}
                  تومان
                </span>
              </button>

              {open && (
                <div className="border-border space-y-4 border-t px-4 py-4">
                  {feedback && (
                    <StatusBanner
                      type={feedback.type}
                      message={feedback.message}
                      onDismiss={
                        feedback.type === 'success'
                          ? () => setPlanFeedback(plan.id, undefined)
                          : undefined
                      }
                    />
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>نام پلن</Label>
                      <Input
                        value={plan.name}
                        disabled={!canEdit || isSaving}
                        onChange={(e) => updatePlan(index, { name: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug (یکتا)</Label>
                      <Input
                        value={plan.slug}
                        disabled={!canEdit || isSaving}
                        onChange={(e) => updatePlan(index, { slug: e.target.value })}
                        className="rounded-xl font-mono text-sm"
                        dir="ltr"
                        placeholder="digital-monthly"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع</Label>
                      <select
                        value={plan.type}
                        disabled={!canEdit || isSaving}
                        onChange={(e) =>
                          updatePlan(index, { type: e.target.value as SubscriptionPlanType })
                        }
                        className="border-border bg-background h-10 w-full rounded-xl border px-3 text-sm"
                      >
                        {(Object.keys(PLAN_TYPE_LABELS) as SubscriptionPlanType[]).map((type) => (
                          <option key={type} value={type}>
                            {PLAN_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>دوره</Label>
                      <select
                        value={plan.period}
                        disabled={!canEdit || isSaving}
                        onChange={(e) =>
                          updatePlan(index, { period: e.target.value as SubscriptionPlanPeriod })
                        }
                        className="border-border bg-background h-10 w-full rounded-xl border px-3 text-sm"
                      >
                        {(Object.keys(PLAN_PERIOD_LABELS) as SubscriptionPlanPeriod[]).map(
                          (period) => (
                            <option key={period} value={period}>
                              {PLAN_PERIOD_LABELS[period]}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>قیمت (تومان)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={plan.price}
                        disabled={!canEdit || isSaving}
                        onChange={(e) => updatePlan(index, { price: Number(e.target.value) || 0 })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع تخفیف محصول</Label>
                      <select
                        value={plan.discountType ?? 'none'}
                        disabled={!canEdit || isSaving}
                        onChange={(e) =>
                          updatePlan(index, {
                            discountType: e.target.value as PlanSaleDiscountType,
                            discountValue:
                              e.target.value === 'none' ? 0 : (plan.discountValue ?? 0),
                          })
                        }
                        className="border-border bg-background h-10 w-full rounded-xl border px-3 text-sm"
                      >
                        <option value="none">بدون تخفیف</option>
                        <option value="percent">درصدی</option>
                        <option value="fixed">مبلغ ثابت</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {(plan.discountType ?? 'none') === 'percent'
                          ? 'درصد تخفیف'
                          : (plan.discountType ?? 'none') === 'fixed'
                            ? 'مبلغ تخفیف (تومان)'
                            : 'مقدار تخفیف'}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={(plan.discountType ?? 'none') === 'percent' ? 100 : undefined}
                        value={plan.discountValue ?? 0}
                        disabled={!canEdit || isSaving || (plan.discountType ?? 'none') === 'none'}
                        onChange={(e) =>
                          updatePlan(index, { discountValue: Number(e.target.value) || 0 })
                        }
                        className="rounded-xl"
                      />
                      {planHasSaleDiscount(plan) && (
                        <p className="text-primary text-xs">
                          قیمت نهایی: {formatPrice(getPlanSalePrice(plan))} تومان
                          <span className="text-muted-foreground ms-2 line-through">
                            {formatPrice(plan.price)}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-end gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={plan.isActive}
                          disabled={!canEdit || isSaving}
                          onChange={(e) => updatePlan(index, { isActive: e.target.checked })}
                        />
                        فعال در سایت
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(plan.popular)}
                          disabled={!canEdit || isSaving}
                          onChange={(e) => updatePlan(index, { popular: e.target.checked })}
                        />
                        پرطرفدار
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>ویژگی‌ها</Label>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={`${plan.id}-f-${featureIndex}`} className="flex gap-2">
                        <Input
                          value={feature}
                          disabled={!canEdit || isSaving}
                          onChange={(e) => updateFeature(index, featureIndex, e.target.value)}
                          className="rounded-xl"
                          placeholder="مزیت پلن..."
                        />
                        {canEdit && plan.features.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={isSaving}
                            className="text-destructive shrink-0 rounded-xl"
                            onClick={() => removeFeature(index, featureIndex)}
                          >
                            حذف
                          </Button>
                        )}
                      </div>
                    ))}
                    {canEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        className="rounded-xl"
                        onClick={() => addFeature(index)}
                      >
                        + ویژگی
                      </Button>
                    )}
                  </div>

                  {canEdit && (
                    <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      {plans.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isSaving || savingId !== null}
                          className="text-destructive rounded-xl"
                          onClick={() => handleDeletePlan(index)}
                        >
                          حذف پلن
                        </Button>
                      ) : (
                        <span />
                      )}
                      <LoadingButton
                        loading={isSaving}
                        disabled={savingId !== null && !isSaving}
                        onClick={() => handleSavePlan(index)}
                        className="rounded-xl"
                      >
                        ذخیره این پلن
                      </LoadingButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
