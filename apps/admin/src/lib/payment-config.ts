import path from 'node:path';
import { env as nodeEnv } from 'node:process';
import { loadEnvConfig } from '@next/env';
import { prisma } from '@vargah/database';
import {
  DEFAULT_PAYMENT_CONFIG,
  PAYMENT_CONFIG_KEY,
  mergePaymentConfig,
  normalizeCallbackBaseUrl,
  type PaymentConfig,
} from '@vargah/business/payment-config';
import { decryptSecret, encryptSecret } from '@vargah/security/secrets';

function ensureMonorepoEnv() {
  if (nodeEnv.SECRETS_ENCRYPTION_KEY?.trim()) return;
  loadEnvConfig(path.resolve(process.cwd(), '../..'));
  if (!nodeEnv.SECRETS_ENCRYPTION_KEY?.trim()) {
    loadEnvConfig(path.resolve(process.cwd()));
  }
}

function decryptPaymentConfig(config: PaymentConfig): PaymentConfig {
  ensureMonorepoEnv();
  return {
    ...config,
    zarinpal: {
      ...config.zarinpal,
      merchantId: decryptSecret(config.zarinpal.merchantId),
    },
  };
}

function encryptPaymentConfig(config: PaymentConfig): PaymentConfig {
  ensureMonorepoEnv();
  return {
    ...config,
    callbackBaseUrl: normalizeCallbackBaseUrl(config.callbackBaseUrl),
    zarinpal: {
      ...config.zarinpal,
      merchantId: encryptSecret(config.zarinpal.merchantId),
    },
  };
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: PAYMENT_CONFIG_KEY } });
  if (!row?.value) return DEFAULT_PAYMENT_CONFIG;
  return decryptPaymentConfig(mergePaymentConfig(row.value));
}

export async function savePaymentConfig(config: PaymentConfig) {
  const encrypted = encryptPaymentConfig(config);
  await prisma.siteSetting.upsert({
    where: { key: PAYMENT_CONFIG_KEY },
    create: { key: PAYMENT_CONFIG_KEY, value: encrypted },
    update: { value: encrypted },
  });
}
