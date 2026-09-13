import type { MessagingConfig } from '@vargah/business/messaging-config';
import type { PaymentConfig } from '@vargah/business/payment-config';
import type { MapConfig } from '@vargah/business/map-config';

import { SETTINGS_SECRET_PLACEHOLDER } from '@/lib/settings-secrets';

/** اسرار واقعی هرگز به مرورگر فرستاده نمی‌شوند — فقط placeholder */
export function toClientMessagingConfig(config: MessagingConfig): MessagingConfig {
  return {
    email: {
      ...config.email,
      password: config.email.password ? SETTINGS_SECRET_PLACEHOLDER : '',
    },
    sms: {
      ...config.sms,
      apiKey: config.sms.apiKey ? SETTINGS_SECRET_PLACEHOLDER : '',
      password: config.sms.password ? SETTINGS_SECRET_PLACEHOLDER : '',
    },
  };
}

export function toClientPaymentConfig(config: PaymentConfig): PaymentConfig {
  return {
    ...config,
    zarinpal: {
      ...config.zarinpal,
      merchantId: config.zarinpal.merchantId ? SETTINGS_SECRET_PLACEHOLDER : '',
    },
  };
}

export function toClientMapConfig(config: MapConfig): MapConfig {
  return {
    ...config,
    googleApiKey: config.googleApiKey ? SETTINGS_SECRET_PLACEHOLDER : '',
  };
}

export function toClientWebhookSecret(secret: string | null): string | null {
  if (!secret) return null;
  return SETTINGS_SECRET_PLACEHOLDER;
}
