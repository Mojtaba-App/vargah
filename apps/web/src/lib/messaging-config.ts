import { prisma } from '@vargah/database';
import {
  DEFAULT_MESSAGING_CONFIG,
  MESSAGING_CONFIG_KEY,
  mergeMessagingConfig,
  type MessagingConfig,
} from '@vargah/business/messaging-config';
import { decryptSecret } from '@vargah/security/secrets';

/** خواندن پیکربندی پیامک برای OTP عمومی سایت */
export async function getMessagingConfig(): Promise<MessagingConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: MESSAGING_CONFIG_KEY } });
  if (!row?.value) return DEFAULT_MESSAGING_CONFIG;
  const merged = mergeMessagingConfig(row.value);
  return {
    email: {
      ...merged.email,
      password: decryptSecret(merged.email.password),
    },
    sms: {
      ...merged.sms,
      apiKey: decryptSecret(merged.sms.apiKey),
      password: decryptSecret(merged.sms.password),
    },
  };
}
