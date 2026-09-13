/** Client-safe communication enums (no Prisma runtime). */
export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WEBHOOK: 'WEBHOOK',
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const WebhookProvider = {
  TELEGRAM: 'TELEGRAM',
  EITAA: 'EITAA',
  BALE: 'BALE',
  SLACK: 'SLACK',
  DISCORD: 'DISCORD',
  GENERIC: 'GENERIC',
} as const;

export type WebhookProvider = (typeof WebhookProvider)[keyof typeof WebhookProvider];

export const WEBHOOK_PROVIDER_ORDER: WebhookProvider[] = [
  WebhookProvider.TELEGRAM,
  WebhookProvider.EITAA,
  WebhookProvider.BALE,
  WebhookProvider.SLACK,
  WebhookProvider.DISCORD,
  WebhookProvider.GENERIC,
];

export const WEBHOOK_EVENT_OPTIONS = [
  { value: 'ticket.created', label: 'تیکت جدید' },
  { value: 'commission.assigned', label: 'اختصاص سفارش مطلب' },
  { value: 'commission.reviewed', label: 'بازبینی سفارش مطلب' },
  { value: 'commission.deadline', label: 'مهلت سفارش مطلب' },
] as const;
