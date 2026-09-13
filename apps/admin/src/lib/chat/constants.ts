export const CHAT_STATUS_LABELS = {
  WAITING: 'در انتظار',
  OPEN: 'فعال',
  CLOSED: 'بسته',
} as const;

export const CHAT_STATUS_VARIANT = {
  WAITING: 'default',
  OPEN: 'success',
  CLOSED: 'secondary',
} as const;

export type ChatStatusFilter = 'ALL' | 'WAITING' | 'OPEN' | 'CLOSED';

export const CHAT_STATUS_ORDER: Record<'WAITING' | 'OPEN' | 'CLOSED', number> = {
  WAITING: 0,
  OPEN: 1,
  CLOSED: 2,
};
