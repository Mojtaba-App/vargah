import { humanizePaymentError } from './payment-errors';

type ZarinpalResponse<T> = {
  data?: T & { code?: number; message?: string };
  errors?: { code: number; message: string; validations?: unknown[] };
};

function zarinpalErrorMessage(fallback: string, json: ZarinpalResponse<unknown>) {
  const raw = json.errors?.message || json.data?.message || fallback;
  return humanizePaymentError(raw);
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
  return sandbox ? 'https://sandbox.zarinpal.com/pg/v4/payment' : 'https://api.zarinpal.com/pg/v4/payment';
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
  const res = await fetch(`${getApiBase(params.sandbox)}/request.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      merchant_id: params.merchantId,
      amount: params.amount,
      callback_url: params.callbackUrl,
      description: params.description.slice(0, 255),
      metadata: {
        email: params.email,
        mobile: params.mobile,
      },
    }),
  });

  const json = (await res.json()) as ZarinpalResponse<{
    authority: string;
    fee: number;
    fee_type: string;
  }>;

  if (!res.ok || json.errors || json.data?.code !== 100 || !json.data.authority) {
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
  const res = await fetch(`${getApiBase(params.sandbox)}/verify.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      merchant_id: params.merchantId,
      amount: params.amount,
      authority: params.authority,
    }),
  });

  const json = (await res.json()) as ZarinpalResponse<{
    ref_id: number;
    card_pan: string;
    card_hash: string;
  }>;

  if (!res.ok || json.errors || (json.data?.code !== 100 && json.data?.code !== 101)) {
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
  if (!params.merchantId.trim()) {
    throw new Error('Merchant ID الزامی است');
  }

  const callbackUrl = params.callbackUrl.trim() || 'http://localhost:3000/api/payments/callback';

  await zarinpalRequestPayment({
    merchantId: params.merchantId.trim(),
    amount: 1000,
    callbackUrl,
    description: 'تست اتصال درگاه — وارگه',
    sandbox: params.sandbox,
  });

  const mode = params.sandbox ? 'Sandbox' : 'Production';
  return `اتصال به زرین‌پال (${mode}) برقرار شد — Merchant ID معتبر است`;
}
