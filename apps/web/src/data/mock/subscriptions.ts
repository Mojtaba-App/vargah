import type { SubscriptionPlan } from '../types';

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-1',
    slug: 'digital-monthly',
    name: 'اشتراک دیجیتال',
    type: 'digital',
    price: 99000,
    period: 'monthly',
    features: [
      'دسترسی به PDF تمام شماره‌ها',
      'مطالعه آنلاین بدون محدودیت',
      'خبرنامه اختصاصی',
      'دسترسی به آرشیو کامل',
    ],
  },
  {
    id: 'plan-2',
    slug: 'digital-yearly',
    name: 'اشتراک دیجیتال سالانه',
    type: 'digital',
    price: 990000,
    period: 'yearly',
    features: [
      'تمام مزایای اشتراک ماهانه',
      '۲ ماه رایگان',
      'دسترسی زودهنگام به شماره جدید',
      'محتوای اختصاصی مشترکین',
    ],
    popular: true,
  },
  {
    id: 'plan-3',
    slug: 'print-monthly',
    name: 'اشتراک چاپی',
    type: 'print',
    price: 250000,
    period: 'monthly',
    features: [
      'ارسال نسخه چاپی به آدرس شما',
      'بسته‌بندی ویژه',
      'کارت تشکر در هر شماره',
    ],
  },
  {
    id: 'plan-4',
    slug: 'combo-yearly',
    name: 'اشتراک ترکیبی',
    type: 'combo',
    price: 1800000,
    period: 'yearly',
    features: [
      'نسخه چاپی + دیجیتال',
      'تخفیف ۲۰٪ نسبت به خرید جداگانه',
      'اولویت پشتیبانی',
      'دعوت به رویدادهای ویژه',
    ],
    popular: true,
  },
];

export const mockPaymentHistory = [
  { id: 'pay-1', date: '2026-08-01', amount: 990000, plan: 'اشتراک دیجیتال سالانه', status: 'paid' as const },
  { id: 'pay-2', date: '2025-08-01', amount: 990000, plan: 'اشتراک دیجیتال سالانه', status: 'paid' as const },
  { id: 'pay-3', date: '2024-08-01', amount: 792000, plan: 'اشتراک دیجیتال سالانه', status: 'paid' as const },
];
