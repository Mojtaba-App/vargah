/** نگاشت پیام‌های خام API/validation به متن فارسی قابل‌فهم */
const PAYMENT_ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /merchant id must not be greater than 36/i,
    message: 'شناسه پذیرنده (Merchant ID) نباید بیشتر از ۳۶ کاراکتر باشد.',
  },
  {
    pattern: /merchant id must not be less than/i,
    message: 'شناسه پذیرنده (Merchant ID) نامعتبر است — فرمت UUID را رعایت کنید.',
  },
  {
    pattern: /merchant id is invalid/i,
    message: 'شناسه پذیرنده (Merchant ID) نامعتبر است.',
  },
  {
    pattern: /merchant id/i,
    message: 'شناسه پذیرنده (Merchant ID) نامعتبر است.',
  },
  {
    pattern: /callback url/i,
    message: 'آدرس Callback نامعتبر است — آدرس پایه سایت را بررسی کنید.',
  },
  {
    pattern: /invalid authority/i,
    message: 'شناسه تراکنش (Authority) نامعتبر است.',
  },
];

export function humanizePaymentError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'خطا در ارتباط با درگاه پرداخت';

  for (const { pattern, message } of PAYMENT_ERROR_PATTERNS) {
    if (pattern.test(trimmed)) return message;
  }

  return trimmed;
}
