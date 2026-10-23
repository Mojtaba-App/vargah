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
    pattern: /merchant id is invalid|invalid merchant/i,
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
  {
    pattern:
      /fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|UND_ERR_|CERT_|SSL|network|getaddrinfo|connect timeout|aborted/i,
    message:
      'اتصال به سرور زرین‌پال برقرار نشد. VPN را خاموش کنید، اینترنت را بررسی کنید و اگر حالت Sandbox روشن است دوباره تست کنید.',
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
