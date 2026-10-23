import { humanizePaymentError } from './payment-errors';

type ZarinpalResponse<T> = {
  data?: T & { code?: number; message?: string };
  errors?: { code: number; message: string; validations?: unknown[] } | unknown[];
};

const MERCHANT_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REQUEST_TIMEOUT_MS = 20_000;

function zarinpalErrorMessage(fallback: string, json: ZarinpalResponse<unknown>) {
  const errors = json.errors;
  const errorMessage =
    errors && !Array.isArray(errors) && typeof errors.message === 'string'
      ? errors.message
      : undefined;
  const raw = errorMessage || json.data?.message || fallback;
  return humanizePaymentError(raw);
}

function assertMerchantId(merchantId: string) {
  const trimmed = merchantId.trim();
  if (!trimmed) {
    throw new Error('Merchant ID الزامی است');
  }
  if (!MERCHANT_UUID_RE.test(trimmed)) {
    throw new Error(
      'شناسه پذیرنده باید ۳۶ کاراکتر با فرمت UUID باشد. نمونه: 00000000-0000-0000-0000-000000000000',
    );
  }
  return trimmed;
}

function networkFailureMessage(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = (current as Error & { cause?: unknown }).cause;
      continue;
    }
    if (typeof current === 'object' && current && 'code' in current) {
      parts.push(String((current as { code?: unknown }).code ?? ''));
    }
    break;
  }
  return humanizePaymentError(parts.filter(Boolean).join(' ') || 'fetch failed');
}

async function zarinpalFetch(url: string, body: Record<string, unknown>): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (error) {
    throw new Error(networkFailureMessage(error));
  } finally {
    clearTimeout(timer);
  }
}

export type ZarinpalRequestResult = {
  authority: string;
  fee: number;
  feeType: string;
};

export type ZarinpalVerifyResult = {
  refId: number;
  cardPan: string;
  cardHash: string;
};

function getApiBase(sandbox: boolean) {
  // Official docs now use payment.zarinpal.com for production; sandbox stays on sandbox host.
  return sandbox
    ? 'https://sandbox.zarinpal.com/pg/v4/payment'
    : 'https://payment.zarinpal.com/pg/v4/payment';
}

export function zarinpalStartPayUrl(authority: string, sandbox: boolean): string {
  const base = sandbox
    ? 'https://sandbox.zarinpal.com/pg/StartPay'
    : 'https://www.zarinpal.com/pg/StartPay';
  return `${base}/${authority}`;
}

export async function zarinpalRequestPayment(params: {
  merchantId: string;
  amount: number;
  callbackUrl: string;
  description: string;
  sandbox: boolean;
  email?: string;
  mobile?: string;
}): Promise<ZarinpalRequestResult> {
  const merchantId = assertMerchantId(params.merchantId);
  const metadata: Record<string, string> = {};
  if (params.email?.trim()) metadata.email = params.email.trim();
  if (params.mobile?.trim()) metadata.mobile = params.mobile.trim();

  const res = await zarinpalFetch(`${getApiBase(params.sandbox)}/request.json`, {
    merchant_id: merchantId,
    amount: params.amount,
    callback_url: params.callbackUrl,
    description: params.description.slice(0, 255),
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  });

  let json: ZarinpalResponse<{
    authority: string;
    fee: number;
    fee_type: string;
  }>;
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error(humanizePaymentError(`HTTP ${res.status}`));
  }

  const hasErrors = Array.isArray(json.errors)
    ? json.errors.length > 0
    : Boolean(json.errors && typeof json.errors === 'object');

  if (!res.ok || hasErrors || json.data?.code !== 100 || !json.data.authority) {
    throw new Error(zarinpalErrorMessage('درخواست پرداخت زرین‌پال ناموفق بود', json));
  }

  return {
    authority: json.data.authority,
    fee: json.data.fee,
    feeType: json.data.fee_type,
  };
}

export async function zarinpalVerifyPayment(params: {
  merchantId: string;
  amount: number;
  authority: string;
  sandbox: boolean;
}): Promise<ZarinpalVerifyResult> {
  const merchantId = assertMerchantId(params.merchantId);
  const res = await zarinpalFetch(`${getApiBase(params.sandbox)}/verify.json`, {
    merchant_id: merchantId,
    amount: params.amount,
    authority: params.authority,
  });

  let json: ZarinpalResponse<{
    ref_id: number;
    card_pan: string;
    card_hash: string;
  }>;
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error(humanizePaymentError(`HTTP ${res.status}`));
  }

  const hasErrors = Array.isArray(json.errors)
    ? json.errors.length > 0
    : Boolean(json.errors && typeof json.errors === 'object');

  if (!res.ok || hasErrors || (json.data?.code !== 100 && json.data?.code !== 101)) {
    throw new Error(zarinpalErrorMessage('تأیید پرداخت زرین‌پال ناموفق بود', json));
  }

  if (!json.data?.ref_id) {
    throw new Error('شناسه تراکنش از درگاه دریافت نشد');
  }

  return {
    refId: json.data.ref_id,
    cardPan: json.data.card_pan,
    cardHash: json.data.card_hash,
  };
}

export async function zarinpalTestConnection(params: {
  merchantId: string;
  sandbox: boolean;
  callbackUrl: string;
}): Promise<string> {
  const merchantId = assertMerchantId(params.merchantId);
  const callbackUrl = params.callbackUrl.trim() || 'http://localhost:3000/api/payments/callback';

  await zarinpalRequestPayment({
    merchantId,
    amount: 1000,
    callbackUrl,
    description: 'تست اتصال درگاه — وارگه',
    sandbox: params.sandbox,
  });

  const mode = params.sandbox ? 'Sandbox' : 'Production';
  return `اتصال به زرین‌پال (${mode}) برقرار شد — Merchant ID معتبر است`;
}
