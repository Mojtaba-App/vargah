import { prisma } from '@vargah/database';
import {
  DEFAULT_MESSAGING_CONFIG,
  MESSAGING_CONFIG_KEY,
  mergeMessagingConfig,
  type MessagingConfig,
} from '@vargah/business/messaging-config';
import { decryptSecret, encryptSecret } from '@vargah/security/secrets';

function decryptMessagingConfig(config: MessagingConfig): MessagingConfig {
  return {
    email: {
      ...config.email,
      password: decryptSecret(config.email.password),
    },
    sms: {
      ...config.sms,
      apiKey: decryptSecret(config.sms.apiKey),
      password: decryptSecret(config.sms.password),
    },
  };
}

function encryptMessagingConfig(config: MessagingConfig): MessagingConfig {
  return {
    email: {
      ...config.email,
      password: encryptSecret(config.email.password),
    },
    sms: {
      ...config.sms,
      apiKey: encryptSecret(config.sms.apiKey),
      password: encryptSecret(config.sms.password),
    },
  };
}

export async function getMessagingConfig(): Promise<MessagingConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: MESSAGING_CONFIG_KEY } });
  if (!row?.value) return DEFAULT_MESSAGING_CONFIG;
  return decryptMessagingConfig(mergeMessagingConfig(row.value));
}

export async function saveMessagingConfig(config: MessagingConfig) {
  const encrypted = encryptMessagingConfig(config);
  await prisma.siteSetting.upsert({
    where: { key: MESSAGING_CONFIG_KEY },
    create: { key: MESSAGING_CONFIG_KEY, value: encrypted },
    update: { value: encrypted },
  });
}
