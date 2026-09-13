export const MessageType = {
  CONTACT: 'CONTACT',
  COLLABORATION: 'COLLABORATION',
  ADVERTISEMENT: 'ADVERTISEMENT',
  INTERNAL: 'INTERNAL',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const MessageStatus = {
  NEW: 'NEW',
  READ: 'READ',
  REPLIED: 'REPLIED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export type MessageTypeFilter = MessageType | 'ALL';
export type MessageStatusFilter = MessageStatus | 'ALL';

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  CONTACT: 'تماس',
  COLLABORATION: 'همکاری',
  ADVERTISEMENT: 'آگهی',
  INTERNAL: 'داخلی',
};

export const MESSAGE_TYPE_VARIANT: Record<
  MessageType,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  CONTACT: 'default',
  COLLABORATION: 'secondary',
  ADVERTISEMENT: 'outline',
  INTERNAL: 'outline',
};

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  NEW: 'جدید',
  READ: 'خوانده‌شده',
  REPLIED: 'پاسخ‌داده',
  ARCHIVED: 'آرشیو',
};

export const MESSAGE_STATUS_VARIANT: Record<
  MessageStatus,
  'default' | 'secondary' | 'outline' | 'destructive' | 'success'
> = {
  NEW: 'default',
  READ: 'secondary',
  REPLIED: 'success',
  ARCHIVED: 'outline',
};

export const MESSAGE_TYPE_DESCRIPTIONS: Record<MessageType, string> = {
  CONTACT: 'فرم تماس و خبرنامه',
  COLLABORATION: 'ارسال مقاله، درخواست همکاری و رزومه',
  ADVERTISEMENT: 'درخواست تبلیغات و آگهی',
  INTERNAL: 'پیام داخلی تیم',
};

/** انتقال‌های مجاز وضعیت در صندوق پیام */
export const MESSAGE_STATUS_TRANSITIONS: Record<MessageStatus, MessageStatus[]> = {
  NEW: [MessageStatus.READ, MessageStatus.ARCHIVED],
  READ: [MessageStatus.ARCHIVED],
  REPLIED: [MessageStatus.ARCHIVED, MessageStatus.READ],
  ARCHIVED: [MessageStatus.READ],
};

export function getAllowedMessageStatuses(current: MessageStatus): MessageStatus[] {
  return [current, ...MESSAGE_STATUS_TRANSITIONS[current]];
}

export function canTransitionMessageStatus(from: MessageStatus, to: MessageStatus): boolean {
  if (from === to) return true;
  return MESSAGE_STATUS_TRANSITIONS[from].includes(to);
}

export function assertMessageStatusTransition(from: MessageStatus, to: MessageStatus) {
  if (!canTransitionMessageStatus(from, to)) {
    throw new Error(
      `تغییر وضعیت از «${MESSAGE_STATUS_LABELS[from]}» به «${MESSAGE_STATUS_LABELS[to]}» مجاز نیست.`,
    );
  }
}

export function isMessageActive(status: MessageStatus): boolean {
  return status === MessageStatus.NEW || status === MessageStatus.READ;
}
