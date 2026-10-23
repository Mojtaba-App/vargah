import path from 'node:path';
import { env as nodeEnv } from 'node:process';
import { loadEnvConfig } from '@next/env';
import { prisma } from '@vargah/database';
import {
  DEFAULT_PAYMENT_CONFIG,
  PAYMENT_CONFIG_KEY,
  isPaymentReady,
  mergePaymentConfig,
  resolvePaymentConfig,
  type PaymentConfig,
} from '@vargah/business/payment-config';
import { decryptSecret, isEncryptedSecret } from '@vargah/security/secrets';

function ensureMonorepoEnv() {
  if (nodeEnv.SECRETS_ENCRYPTION_KEY?.trim()) return;
  // apps/web → monorepo root (also try cwd when started from root)
  loadEnvConfig(path.resolve(process.cwd(), '../..'));
  if (!nodeEnv.SECRETS_ENCRYPTION_KEY?.trim()) {
    loadEnvConfig(path.resolve(process.cwd()));
  }
}

function decryptMerchantId(value: string): string {
  ensureMonorepoEnv();
  try {
    return decryptSecret(value);
  } catch (error) {
    if (isEncryptedSecret(value)) {
      console.warn(
        '[payment-config] نتوانست Merchant ID رمزنگاری‌شده را بخواند — SECRETS_ENCRYPTION_KEY را در .env ریشه بررسی کنید.',
      );
      return '';
    }
    throw error;
  }
}

/** بدون cache — تنظیمات پرداخت باید بلافاصله بعد از ذخیره در پنل روی سایت اعمال شود */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  try {
    ensureMonorepoEnv();
    const row = await prisma.siteSetting.findUnique({ where: { key: PAYMENT_CONFIG_KEY } });
    const merged = row?.value ? mergePaymentConfig(row.value) : DEFAULT_PAYMENT_CONFIG;
    const decrypted: PaymentConfig = {
      ...merged,
      zarinpal: {
        ...merged.zarinpal,
        merchantId: decryptMerchantId(merged.zarinpal.merchantId),
      },
    };
    return resolvePaymentConfig(decrypted);
  } catch (error) {
    console.warn('[payment-config] Falling back to defaults:', error);
    return resolvePaymentConfig(DEFAULT_PAYMENT_CONFIG);
  }
}

export type PublicPaymentStatus = {
  ready: boolean;
  blockReason: string | null;
};

/** وضعیت درگاه برای UI — بدون افشای Merchant ID به کلاینت */
export async function getPublicPaymentStatus(): Promise<PublicPaymentStatus> {
  const resolved = await getPaymentConfig();
  if (isPaymentReady(resolved)) {
    return { ready: true, blockReason: null };
  }
  const blockReason = !resolved.enabled
    ? 'درگاه در پنل غیرفعال است'
    : !resolved.zarinpal.merchantId
      ? 'Merchant ID زرین‌پال در تنظیمات وارد نشده'
      : !resolved.callbackBaseUrl
        ? 'آدرس callback سایت تنظیم نشده'
        : 'تنظیمات درگاه ناقص است';
  return { ready: false, blockReason };
}
