export const ContributorType = {
  WRITER: 'WRITER',
  JOURNALIST: 'JOURNALIST',
  DESIGNER: 'DESIGNER',
  PHOTOGRAPHER: 'PHOTOGRAPHER',
} as const;

export type ContributorType = (typeof ContributorType)[keyof typeof ContributorType];

export const CommissionStatus = {
  TOPIC_DEFINED: 'TOPIC_DEFINED',
  ASSIGNED: 'ASSIGNED',
  IN_WRITING: 'IN_WRITING',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type CommissionStatus = (typeof CommissionStatus)[keyof typeof CommissionStatus];

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export type ContributorTypeFilter = ContributorType | 'ALL';
export type CommissionStatusFilter = CommissionStatus | 'ALL' | 'OVERDUE';
export type TaskStatusFilter = TaskStatus | 'ALL' | 'OVERDUE';
export type ContributorsTab = 'profiles' | 'commissions' | 'tasks' | 'calendar';

export const CONTRIBUTOR_TYPE_LABELS: Record<ContributorType, string> = {
  WRITER: 'نویسنده',
  JOURNALIST: 'خبرنگار',
  DESIGNER: 'طراح',
  PHOTOGRAPHER: 'عکاس',
};

export const CONTRIBUTOR_TYPE_VARIANT: Record<
  ContributorType,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  WRITER: 'default',
  JOURNALIST: 'secondary',
  DESIGNER: 'outline',
  PHOTOGRAPHER: 'outline',
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  TOPIC_DEFINED: 'تعریف سوژه',
  ASSIGNED: 'تخصیص به نویسنده',
  IN_WRITING: 'در حال نگارش',
  SUBMITTED: 'تحویل‌شده',
  IN_REVIEW: 'در بازبینی',
  APPROVED: 'تأیید نهایی',
  REJECTED: 'رد شده',
};

export const COMMISSION_STATUS_VARIANT: Record<
  CommissionStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  TOPIC_DEFINED: 'outline',
  ASSIGNED: 'secondary',
  IN_WRITING: 'default',
  SUBMITTED: 'secondary',
  IN_REVIEW: 'default',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'در انتظار',
  IN_PROGRESS: 'در حال انجام',
  SUBMITTED: 'ارسال‌شده',
  IN_REVIEW: 'در بازبینی',
  APPROVED: 'تأییدشده',
  REJECTED: 'ردشده',
};

export const TASK_STATUS_VARIANT: Record<
  TaskStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  TODO: 'outline',
  IN_PROGRESS: 'default',
  SUBMITTED: 'secondary',
  IN_REVIEW: 'default',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

export const COMMISSION_TRANSITIONS: Record<CommissionStatus, CommissionStatus[]> = {
  TOPIC_DEFINED: [CommissionStatus.ASSIGNED],
  ASSIGNED: [CommissionStatus.IN_WRITING],
  IN_WRITING: [CommissionStatus.SUBMITTED],
  SUBMITTED: [CommissionStatus.IN_REVIEW],
  IN_REVIEW: [CommissionStatus.APPROVED, CommissionStatus.REJECTED],
  REJECTED: [CommissionStatus.IN_WRITING],
  APPROVED: [],
};

export const ACTIVE_COMMISSION_STATUSES: CommissionStatus[] = [
  CommissionStatus.TOPIC_DEFINED,
  CommissionStatus.ASSIGNED,
  CommissionStatus.IN_WRITING,
  CommissionStatus.SUBMITTED,
  CommissionStatus.IN_REVIEW,
];

export const ACTIVE_TASK_STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.SUBMITTED,
  TaskStatus.IN_REVIEW,
];

export function canTransitionCommission(from: CommissionStatus, to: CommissionStatus): boolean {
  return COMMISSION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isCommissionOverdue(dueDate: Date | null, status: CommissionStatus): boolean {
  if (!dueDate) return false;
  if (status === CommissionStatus.APPROVED || status === CommissionStatus.REJECTED) return false;
  return dueDate.getTime() < Date.now();
}

export function isTaskOverdue(dueDate: Date | null, status: TaskStatus): boolean {
  if (!dueDate) return false;
  if (status === TaskStatus.APPROVED || status === TaskStatus.REJECTED) return false;
  return dueDate.getTime() < Date.now();
}

export function isCalendarOverdue(dueDate: Date): boolean {
  return dueDate.getTime() < Date.now();
}

export const TAB_LABELS: Record<ContributorsTab, string> = {
  profiles: 'پروفایل‌ها',
  commissions: 'گردش کار مطلب',
  tasks: 'وظایف',
  calendar: 'تقویم تحریریه',
};
