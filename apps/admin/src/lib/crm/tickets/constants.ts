export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_CUSTOMER: 'WAITING_CUSTOMER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

export const TicketCustomerType = {
  GUEST: 'GUEST',
  SUBSCRIBER: 'SUBSCRIBER',
  ADVERTISER: 'ADVERTISER',
} as const;

export type TicketCustomerType = (typeof TicketCustomerType)[keyof typeof TicketCustomerType];

export type TicketStatusFilter = TicketStatus | 'ALL';
export type TicketPriorityFilter = TicketPriority | 'ALL';
export type TicketCustomerFilter = TicketCustomerType | 'ALL';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'باز',
  IN_PROGRESS: 'در حال پیگیری',
  WAITING_CUSTOMER: 'منتظر مشتری',
  RESOLVED: 'حل‌شده',
  CLOSED: 'بسته',
};

export const TICKET_STATUS_VARIANT: Record<
  TicketStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  WAITING_CUSTOMER: 'outline',
  RESOLVED: 'secondary',
  CLOSED: 'outline',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'کم',
  NORMAL: 'معمولی',
  HIGH: 'بالا',
  URGENT: 'فوری',
};

export const TICKET_PRIORITY_VARIANT: Record<
  TicketPriority,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  LOW: 'outline',
  NORMAL: 'secondary',
  HIGH: 'default',
  URGENT: 'destructive',
};

export const TICKET_CUSTOMER_TYPE_LABELS: Record<TicketCustomerType, string> = {
  GUEST: 'مهمان',
  SUBSCRIBER: 'مشترک',
  ADVERTISER: 'آگهی‌دهنده',
};

export const TICKET_STATUS_OPTIONS = Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => ({
  value: value as TicketStatus,
  label,
}));

export const ACTIVE_TICKET_STATUSES: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_CUSTOMER,
];

export function isTicketActive(status: TicketStatus) {
  return ACTIVE_TICKET_STATUSES.includes(status);
}

export function getTicketShortId(id: string) {
  return id.slice(-6).toUpperCase();
}
