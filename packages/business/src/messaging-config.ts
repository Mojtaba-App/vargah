export type SmsProvider = 'kavenegar' | 'melipayamak' | 'sms_ir';

export type EmailConfig = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
};

export type SmsConfig = {
  enabled: boolean;
  provider: SmsProvider;
  apiKey: string;
  username: string;
  password: string;
  lineNumber: string;
  sender: string;
};

export type MessagingConfig = {
  email: EmailConfig;
  sms: SmsConfig;
};

export const MESSAGING_CONFIG_KEY = 'messaging_config';

export const DEFAULT_MESSAGING_CONFIG: MessagingConfig = {
  email: {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromName: 'وارگه',
    fromEmail: '',
  },
  sms: {
    enabled: false,
    provider: 'kavenegar',
    apiKey: '',
    username: '',
    password: '',
    lineNumber: '',
    sender: '',
  },
};

export const SMS_PROVIDER_LABELS: Record<SmsProvider, string> = {
  kavenegar: 'کاوه‌نگار',
  melipayamak: 'ملی‌پیامک',
  sms_ir: 'SMS.ir',
};

export function mergeMessagingConfig(value: unknown): MessagingConfig {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<MessagingConfig>;

  return {
    email: { ...DEFAULT_MESSAGING_CONFIG.email, ...input.email },
    sms: { ...DEFAULT_MESSAGING_CONFIG.sms, ...input.sms },
  };
}

export function maskSecret(value: string, visible = 4) {
  if (!value) return '';
  if (value.length <= visible) return '••••';
  return `${'•'.repeat(Math.min(value.length - visible, 8))}${value.slice(-visible)}`;
}
