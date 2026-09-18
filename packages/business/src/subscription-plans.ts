export type SubscriptionPlanType = 'digital' | 'print' | 'combo';
export type SubscriptionPlanPeriod = 'monthly' | 'yearly';
export type PlanSaleDiscountType = 'none' | 'percent' | 'fixed';

export type SubscriptionPlanConfig = {
  id: string;
  slug: string;
  name: string;
  type: SubscriptionPlanType;
  price: number;
  /** نوع تخفیف محصول: درصد یا مبلغ ثابت */
  discountType?: PlanSaleDiscountType;
  /** درصد ۱–۱۰۰ یا مبلغ تومان */
  discountValue?: number;
  period: SubscriptionPlanPeriod;
  periodMonths: number;
  features: string[];
  popular?: boolean;
  isActive: boolean;
  sortOrder: number;
};

export const SUBSCRIPTION_PLANS_KEY = 'subscription_plans';

export const PLAN_TYPE_LABELS: Record<SubscriptionPlanType, string> = {
  digital: 'دیجیتال',
  print: 'چاپی',
  combo: 'ترکیبی',
};

export const PLAN_PERIOD_LABELS: Record<SubscriptionPlanPeriod, string> = {
  monthly: 'ماهانه',
  yearly: 'سالانه',
};

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  {
    id: 'plan-digital-monthly',
    slug: 'digital-monthly',
    name: 'اشتراک دیجیتال',
    type: 'digital',
    price: 99000,
    period: 'monthly',
    periodMonths: 1,
    features: [
      'دسترسی به PDF تمام شماره‌ها',
      'مطالعه آنلاین بدون محدودیت',
      'خبرنامه اختصاصی',
      'دسترسی به آرشیو کامل',
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'plan-digital-yearly',
    slug: 'digital-yearly',
    name: 'اشتراک دیجیتال سالانه',
    type: 'digital',
    price: 990000,
    period: 'yearly',
    periodMonths: 12,
    features: [
      'تمام مزایای اشتراک ماهانه',
      '۲ ماه رایگان',
      'دسترسی زودهنگام به شماره جدید',
      'محتوای اختصاصی مشترکین',
    ],
    popular: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'plan-print-yearly',
    slug: 'print-yearly',
    name: 'اشتراک چاپی',
    type: 'print',
    price: 2500000,
    period: 'yearly',
    periodMonths: 12,
    features: ['ارسال نسخه چاپی به آدرس شما', 'بسته‌بندی ویژه', 'کارت تشکر در هر شماره'],
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'plan-combo-yearly',
    slug: 'combo-yearly',
    name: 'اشتراک ترکیبی',
    type: 'combo',
    price: 1800000,
    period: 'yearly',
    periodMonths: 12,
    features: [
      'نسخه چاپی + دیجیتال',
      'تخفیف ۲۰٪ نسبت به خرید جداگانه',
      'اولویت پشتیبانی',
      'دعوت به رویدادهای ویژه',
    ],
    popular: true,
    isActive: true,
    sortOrder: 4,
  },
];

function normalizeDiscountType(raw: unknown): PlanSaleDiscountType {
  if (raw === 'percent' || raw === 'fixed') return raw;
  return 'none';
}

function normalizePlan(
  raw: Partial<SubscriptionPlanConfig>,
  index: number,
): SubscriptionPlanConfig | null {
  if (!raw.slug || !raw.name) return null;
  const period = raw.period === 'yearly' ? 'yearly' : 'monthly';
  const periodMonths = raw.periodMonths ?? (period === 'yearly' ? 12 : 1);
  const type =
    raw.type === 'print' || raw.type === 'combo' || raw.type === 'digital' ? raw.type : 'digital';
  const discountType = normalizeDiscountType(raw.discountType);
  const discountValue = Math.max(0, Math.floor(Number(raw.discountValue) || 0));

  return {
    id: raw.id || `plan-${raw.slug}`,
    slug: raw.slug,
    name: raw.name,
    type,
    price: Math.max(0, Number(raw.price) || 0),
    discountType,
    discountValue: discountType === 'none' ? 0 : discountValue,
    period,
    periodMonths,
    features: Array.isArray(raw.features)
      ? raw.features.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
      : [],
    popular: Boolean(raw.popular),
    isActive: raw.isActive !== false,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : index,
  };
}

export function mergeSubscriptionPlans(value: unknown): SubscriptionPlanConfig[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_SUBSCRIPTION_PLANS;

  const plans = value
    .map((item, index) => normalizePlan(item as Partial<SubscriptionPlanConfig>, index))
    .filter((p): p is SubscriptionPlanConfig => p !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return plans.length > 0 ? plans : DEFAULT_SUBSCRIPTION_PLANS;
}

export function getActiveSubscriptionPlans(
  plans: SubscriptionPlanConfig[],
): SubscriptionPlanConfig[] {
  return plans.filter((p) => p.isActive && p.price > 0);
}

export function findSubscriptionPlan(
  plans: SubscriptionPlanConfig[],
  slug: string,
): SubscriptionPlanConfig | undefined {
  return plans.find((p) => p.slug === slug && p.isActive);
}

export function getPlanLabelFromList(
  plans: SubscriptionPlanConfig[],
  planType: string | null | undefined,
): string {
  if (!planType) return '—';
  return plans.find((p) => p.slug === planType)?.name ?? planType;
}

export function planRequiresAddress(type: SubscriptionPlanType): boolean {
  return type === 'print' || type === 'combo';
}

export const SUBSCRIPTION_PLAN_SLUG_PREFIX = 'SUBSCRIPTION:';

export function formatSubscriptionPaymentDescription(plan: SubscriptionPlanConfig): string {
  return `${SUBSCRIPTION_PLAN_SLUG_PREFIX}${plan.slug} — ${plan.name}`;
}

export function parseSubscriptionPlanSlug(description: string | null | undefined): string | null {
  if (!description) return null;
  const match = description.match(/^SUBSCRIPTION:([^—]+)/);
  if (!match?.[1]) return null;
  const raw = match[1].trim();
  const first = raw.split(',')[0]?.trim() ?? '';
  const slug = first.includes('*') ? first.split('*')[0]?.trim() : first;
  return slug || null;
}
