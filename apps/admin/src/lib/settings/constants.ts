import { NotificationChannel, WebhookProvider } from '@/lib/communications/enums';

export const SettingsTab = {
  GENERAL: 'GENERAL',
  MESSAGING: 'MESSAGING',
  SERVICES: 'SERVICES',
  ABOUT: 'ABOUT',
  PAYMENTS: 'PAYMENTS',
  MAP: 'MAP',
  AUTOMATION: 'AUTOMATION',
} as const;

export type SettingsTab = (typeof SettingsTab)[keyof typeof SettingsTab];

export const SETTINGS_TAB_LABELS: Record<SettingsTab, string> = {
  GENERAL: 'عمومی',
  MESSAGING: 'پیام‌رسانی',
  SERVICES: 'خدمات سایت',
  ABOUT: 'درباره ما',
  PAYMENTS: 'درگاه پرداخت',
  MAP: 'نقشه و GIS',
  AUTOMATION: 'اتوماسیون',
};

export const SETTINGS_TAB_DESCRIPTIONS: Record<SettingsTab, string> = {
  GENERAL: 'برندینگ، فوتر، تماس با ما و اتصال دیتابیس',
  MESSAGING: 'پیکربندی SMTP، سرویس پیامک و الگوهای ارسال',
  SERVICES: 'منوی خدمات، تبلیغات، همکاری و تعرفه‌ها',
  ABOUT: 'مأموریت، تاریخچه، تیم تحریریه و آمار صفحه درباره ما',
  PAYMENTS: 'پیکربندی درگاه زرین‌پال و تنظیمات پرداخت آنلاین',
  MAP: 'Google Maps (اختیاری)، لایه‌های basemap و GeoJSON سفارشی',
  AUTOMATION: 'Webhook، یادآورها و لاگ اعلان‌ها',
};

/** slug در query string — `/settings?tab=payments` */
export const SETTINGS_TAB_SLUGS: Record<SettingsTab, string> = {
  GENERAL: 'general',
  MESSAGING: 'messaging',
  SERVICES: 'services',
  ABOUT: 'about',
  PAYMENTS: 'payments',
  MAP: 'map',
  AUTOMATION: 'automation',
};

const SLUG_TO_TAB: Record<string, SettingsTab> = Object.fromEntries(
  (Object.entries(SETTINGS_TAB_SLUGS) as [SettingsTab, string][]).flatMap(([tab, slug]) => [
    [slug, tab],
    [tab, tab],
  ]),
) as Record<string, SettingsTab>;

export function resolveSettingsTab(tab?: string | null): SettingsTab {
  if (!tab) return SettingsTab.GENERAL;
  if (tab === 'templates' || tab === 'TEMPLATES') return SettingsTab.MESSAGING;
  return SLUG_TO_TAB[tab] ?? SettingsTab.GENERAL;
}

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: 'ایمیل',
  SMS: 'پیامک',
  WEBHOOK: 'Webhook',
};

export const WEBHOOK_PROVIDER_LABELS: Record<WebhookProvider, string> = {
  TELEGRAM: 'تلگرام',
  EITAA: 'ایتا',
  BALE: 'بله',
  SLACK: 'اسلک',
  DISCORD: 'دیسکورد',
  GENERIC: 'عمومی / سفارشی',
};

export const WEBHOOK_PROVIDER_HINTS: Record<WebhookProvider, string> = {
  TELEGRAM: 'Bot API تلگرام — URL بات و Chat ID کانال/گروه',
  EITAA: 'API ایتا — مشابه تلگرام با Chat ID',
  BALE: 'بات بله — URL ارسال پیام و شناسه گفتگو',
  SLACK: 'Incoming Webhook اسلک — معمولاً فقط URL کافی است',
  DISCORD: 'Webhook کانال دیسکورد — معمولاً فقط URL کافی است',
  GENERIC: 'POST JSON به هر سرویس دیگر با هدر اختیاری Secret',
};

export const WEBHOOK_SECRET_LABELS: Record<WebhookProvider, string> = {
  TELEGRAM: 'Chat ID',
  EITAA: 'Chat ID',
  BALE: 'Chat ID',
  SLACK: 'Signing Secret (اختیاری)',
  DISCORD: 'Secret (اختیاری)',
  GENERIC: 'X-Webhook-Secret (اختیاری)',
};

export const WEBHOOK_URL_PLACEHOLDERS: Record<WebhookProvider, string> = {
  TELEGRAM: 'https://api.telegram.org/bot<TOKEN>/sendMessage',
  EITAA: 'https://eitaayar.ir/api/<TOKEN>/sendMessage',
  BALE: 'https://tapi.bale.ai/bot<TOKEN>/sendMessage',
  SLACK: 'https://hooks.slack.com/services/...',
  DISCORD: 'https://discord.com/api/webhooks/...',
  GENERIC: 'https://example.com/hooks/vargah',
};

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  PENDING: 'در صف',
  SENT: 'ارسال‌شده',
  FAILED: 'ناموفق',
  CANCELLED: 'لغو شده',
};

export const NOTIFICATION_STATUS_VARIANT: Record<
  NotificationStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  PENDING: 'outline',
  SENT: 'default',
  FAILED: 'destructive',
  CANCELLED: 'secondary',
};

export type TemplateChannelFilter = NotificationChannel | 'ALL';
