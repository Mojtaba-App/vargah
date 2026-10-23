export type PaymentProvider = 'zarinpal';

export type ZarinpalConfig = {
  merchantId: string;
  sandbox: boolean;
};

export type PaymentConfig = {
  enabled: boolean;
  provider: PaymentProvider;
  zarinpal: ZarinpalConfig;
  /** آدرس پایه سایت — برای callback درگاه، مثلاً https://vargah.ir */
  callbackBaseUrl: string;
};

export const PAYMENT_CONFIG_KEY = 'payment_config';

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  zarinpal: 'زرین‌پال',
};

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  enabled: false,
  provider: 'zarinpal',
  zarinpal: {
    merchantId: '',
    sandbox: true,
  },
  callbackBaseUrl: '',
};

/** نرمال‌سازی آدرس پایه — اصلاح http://http:// و اسلش انتهایی */
export function normalizeCallbackBaseUrl(raw: string): string {
  let value = raw.trim();
  if (!value) return '';

  value = value.replace(/^(https?:\/\/)+/i, (match) => {
    const isHttps = /https:\/\//i.test(match);
    return isHttps ? 'https://' : 'http://';
  });

  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }

  return value.replace(/\/+$/, '');
}

export function mergePaymentConfig(value: unknown): PaymentConfig {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<PaymentConfig>;
  const zarinpal = {
    ...DEFAULT_PAYMENT_CONFIG.zarinpal,
    ...(input.zarinpal && typeof input.zarinpal === 'object' ? input.zarinpal : {}),
  };

  return {
    ...DEFAULT_PAYMENT_CONFIG,
    ...input,
    zarinpal,
    provider: 'zarinpal',
    callbackBaseUrl: normalizeCallbackBaseUrl(
      typeof input.callbackBaseUrl === 'string'
        ? input.callbackBaseUrl
        : DEFAULT_PAYMENT_CONFIG.callbackBaseUrl,
    ),
  };
}

export function resolvePaymentConfig(config: PaymentConfig): PaymentConfig {
  // Read live process env (avoid Next compile-time inlining of process.env.*)
  const liveEnv = process.env;
  const envMerchant = liveEnv.ZARINPAL_MERCHANT_ID?.trim() ?? '';
  const envBaseUrl = liveEnv.NEXT_PUBLIC_SITE_URL?.trim() ?? '';
  const isDev = liveEnv.NODE_ENV === 'development';

  const sandbox = config.zarinpal.sandbox ?? liveEnv.ZARINPAL_SANDBOX !== 'false';
  const merchantId = config.zarinpal.merchantId || envMerchant;
  const callbackBaseUrl = normalizeCallbackBaseUrl(
    config.callbackBaseUrl || envBaseUrl || (isDev ? 'http://localhost:3000' : ''),
  );

  return {
    ...config,
    zarinpal: {
      ...config.zarinpal,
      merchantId,
      sandbox,
    },
    callbackBaseUrl,
  };
}

export function isPaymentReady(config: PaymentConfig): boolean {
  const resolved = resolvePaymentConfig(config);
  return (
    resolved.enabled && Boolean(resolved.zarinpal.merchantId) && Boolean(resolved.callbackBaseUrl)
  );
}

export function getPaymentCallbackUrl(config: PaymentConfig): string {
  const base = resolvePaymentConfig(config).callbackBaseUrl.replace(/\/$/, '');
  return `${base}/api/payments/callback`;
}

export { maskSecret } from './messaging-config';
