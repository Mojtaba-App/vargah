import { ZodError } from 'zod';
import { humanizePaymentError } from '@vargah/business/payment-errors';

const WEBHOOK_ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /chat not found/i,
    message: 'Chat ID یافت نشد — شناسه چت/کانال را بررسی کنید.',
  },
  {
    pattern: /bot token/i,
    message: 'توکن ربات در URL نامعتبر است.',
  },
  {
    pattern: /unauthorized|401/i,
    message: 'احراز هویت Webhook ناموفق — URL یا توکن را بررسی کنید.',
  },
  {
    pattern: /forbidden|403/i,
    message: 'دسترسی Webhook رد شد — ربات را به کانال/گروه اضافه کنید.',
  },
  {
    pattern: /fetch failed|ECONNREFUSED|ENOTFOUND/i,
    message: 'اتصال به سرور Webhook برقرار نشد — URL را بررسی کنید.',
  },
];

export function humanizeWebhookError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'تست Webhook ناموفق بود';

  for (const { pattern, message } of WEBHOOK_ERROR_PATTERNS) {
    if (pattern.test(trimmed)) return message;
  }

  return trimmed;
}

export function getActionErrorMessage(error: unknown, fallback = 'خطا در انجام عملیات'): string {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    if (first?.message) {
      return humanizePaymentError(String(first.message));
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return humanizePaymentError(error.message);
  }

  return fallback;
}

export function formatWebhookFeedbackMessage(raw: string): string {
  return humanizeWebhookError(raw);
}

export function formatPaymentFeedbackMessage(raw: string): string {
  return humanizePaymentError(raw);
}
