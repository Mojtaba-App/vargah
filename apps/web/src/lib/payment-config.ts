import { prisma } from '@vargah/database';
import {
  DEFAULT_PAYMENT_CONFIG,
  PAYMENT_CONFIG_KEY,
  mergePaymentConfig,
  resolvePaymentConfig,
  type PaymentConfig,
} from '@vargah/business/payment-config';
import { decryptSecret } from '@vargah/security/secrets';

/** بدون cache — تنظیمات پرداخت باید بلافاصله بعد از ذخیره در پنل روی سایت اعمال شود */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: PAYMENT_CONFIG_KEY } });
    const merged = row?.value ? mergePaymentConfig(row.value) : DEFAULT_PAYMENT_CONFIG;
    const decrypted: PaymentConfig = {
      ...merged,
      zarinpal: {
        ...merged.zarinpal,
        merchantId: decryptSecret(merged.zarinpal.merchantId),
      },
    };
    return resolvePaymentConfig(decrypted);
  } catch (error) {
    console.error('[payment-config] Falling back to defaults:', error);
    return resolvePaymentConfig(DEFAULT_PAYMENT_CONFIG);
  }
}
