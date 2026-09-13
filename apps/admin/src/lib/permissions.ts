import { UserRole } from '@vargah/database/enums';

/** تمام دسترسی‌های پنل مدیریت */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  ARTICLE_VIEW: 'article.view',
  ARTICLE_CREATE: 'article.create',
  ARTICLE_EDIT: 'article.edit',
  ARTICLE_DELETE: 'article.delete',
  ARTICLE_PUBLISH: 'article.publish',
  COMMENT_VIEW: 'comment.view',
  COMMENT_MODERATE: 'comment.moderate',
  ISSUE_VIEW: 'issue.view',
  ISSUE_CREATE: 'issue.create',
  ISSUE_EDIT: 'issue.edit',
  ISSUE_DELETE: 'issue.delete',
  CATEGORY_MANAGE: 'category.manage',
  MEDIA_MANAGE: 'media.manage',
  PLAN_VIEW: 'plan.view',
  PLAN_MANAGE: 'plan.manage',
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_MANAGE: 'user.manage',
  ROLE_PERMISSION_MANAGE: 'role.permissions',
  SUBSCRIBER_VIEW: 'subscriber.view',
  SUBSCRIBER_MANAGE: 'subscriber.manage',
  ADVERTISER_VIEW: 'advertiser.view',
  ADVERTISER_MANAGE: 'advertiser.manage',
  CONTRIBUTOR_VIEW: 'contributor.view',
  CONTRIBUTOR_MANAGE: 'contributor.manage',
  COMMISSION_MANAGE: 'commission.manage',
  MESSAGE_VIEW: 'message.view',
  MESSAGE_MANAGE: 'message.manage',
  TICKET_VIEW: 'ticket.view',
  TICKET_MANAGE: 'ticket.manage',
  CHAT_VIEW: 'chat.view',
  CHAT_MANAGE: 'chat.manage',
  GEO_VIEW: 'geo.view',
  GEO_EXPORT: 'geo.export',
  FINANCE_VIEW: 'finance.view',
  FINANCE_MANAGE: 'finance.manage',
  FINANCE_EXPORT: 'finance.export',
  DISCOUNT_VIEW: 'discount.view',
  DISCOUNT_MANAGE: 'discount.manage',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SECURITY_VIEW: 'security.view',
  SECURITY_MANAGE: 'security.manage',
  AUDIT_VIEW: 'audit.view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL = Object.values(PERMISSIONS);

/** ماتریس پیش‌فرض نقش × دسترسی (قابل بازنویسی از DB) */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: ALL,
  [UserRole.PUBLISHER]: ALL,
  [UserRole.MANAGING_DIRECTOR]: ALL,
  [UserRole.EDITOR_IN_CHIEF]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ARTICLE_VIEW,
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_EDIT,
    PERMISSIONS.ARTICLE_DELETE,
    PERMISSIONS.ARTICLE_PUBLISH,
    PERMISSIONS.COMMENT_VIEW,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.ISSUE_VIEW,
    PERMISSIONS.ISSUE_CREATE,
    PERMISSIONS.ISSUE_EDIT,
    PERMISSIONS.ISSUE_DELETE,
    PERMISSIONS.CATEGORY_MANAGE,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.PLAN_VIEW,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.SUBSCRIBER_VIEW,
    PERMISSIONS.ADVERTISER_VIEW,
    PERMISSIONS.CONTRIBUTOR_VIEW,
    PERMISSIONS.CONTRIBUTOR_MANAGE,
    PERMISSIONS.COMMISSION_MANAGE,
    PERMISSIONS.MESSAGE_VIEW,
    PERMISSIONS.MESSAGE_MANAGE,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_MANAGE,
    PERMISSIONS.CHAT_VIEW,
    PERMISSIONS.CHAT_MANAGE,
    PERMISSIONS.GEO_VIEW,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.DISCOUNT_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
  ],
  [UserRole.COPY_EDITOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ARTICLE_VIEW,
    PERMISSIONS.ARTICLE_EDIT,
    PERMISSIONS.COMMENT_VIEW,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.ISSUE_VIEW,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.MESSAGE_VIEW,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.CONTRIBUTOR_VIEW,
  ],
  [UserRole.WRITER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ARTICLE_VIEW,
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_EDIT,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.MESSAGE_VIEW,
  ],
  [UserRole.AD_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ADVERTISER_VIEW,
    PERMISSIONS.ADVERTISER_MANAGE,
    PERMISSIONS.SUBSCRIBER_VIEW,
    PERMISSIONS.MESSAGE_VIEW,
    PERMISSIONS.MESSAGE_MANAGE,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_MANAGE,
    PERMISSIONS.CHAT_VIEW,
    PERMISSIONS.CHAT_MANAGE,
    PERMISSIONS.GEO_VIEW,
    PERMISSIONS.GEO_EXPORT,
    PERMISSIONS.PLAN_VIEW,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.FINANCE_EXPORT,
    PERMISSIONS.DISCOUNT_VIEW,
    PERMISSIONS.DISCOUNT_MANAGE,
  ],
  [UserRole.SUBSCRIBER]: [],
};

/** @deprecated از DEFAULT_ROLE_PERMISSIONS استفاده کنید */
export const ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;

/** نقش‌هایی که همیشه تمام مجوزهای کد را دارند (مثل مدیر کل) */
export const FULL_ACCESS_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.PUBLISHER,
  UserRole.MANAGING_DIRECTOR,
];

export function isFullAccessRole(role: UserRole): boolean {
  return FULL_ACCESS_ROLES.includes(role);
}

/** نقش‌های مجاز برای ورود به پنل */
export const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.PUBLISHER,
  UserRole.MANAGING_DIRECTOR,
  UserRole.EDITOR_IN_CHIEF,
  UserRole.COPY_EDITOR,
  UserRole.WRITER,
  UserRole.AD_MANAGER,
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.DASHBOARD_VIEW]: 'مشاهده داشبورد',
  [PERMISSIONS.ARTICLE_VIEW]: 'مشاهده مقالات',
  [PERMISSIONS.ARTICLE_CREATE]: 'ایجاد مقاله',
  [PERMISSIONS.ARTICLE_EDIT]: 'ویرایش مقاله',
  [PERMISSIONS.ARTICLE_DELETE]: 'حذف مقاله',
  [PERMISSIONS.ARTICLE_PUBLISH]: 'انتشار مقاله',
  [PERMISSIONS.COMMENT_VIEW]: 'مشاهده نظرات',
  [PERMISSIONS.COMMENT_MODERATE]: 'مدیریت نظرات',
  [PERMISSIONS.ISSUE_VIEW]: 'مشاهده شماره‌ها',
  [PERMISSIONS.ISSUE_CREATE]: 'ایجاد شماره',
  [PERMISSIONS.ISSUE_EDIT]: 'ویرایش شماره',
  [PERMISSIONS.ISSUE_DELETE]: 'حذف شماره',
  [PERMISSIONS.CATEGORY_MANAGE]: 'مدیریت دسته‌ها',
  [PERMISSIONS.MEDIA_MANAGE]: 'مدیریت رسانه',
  [PERMISSIONS.PLAN_VIEW]: 'مشاهده پلن‌های اشتراک',
  [PERMISSIONS.PLAN_MANAGE]: 'مدیریت پلن‌های اشتراک',
  [PERMISSIONS.USER_VIEW]: 'مشاهده کاربران',
  [PERMISSIONS.USER_CREATE]: 'ایجاد کاربر',
  [PERMISSIONS.USER_EDIT]: 'ویرایش کاربر',
  [PERMISSIONS.USER_MANAGE]: 'مدیریت کامل کاربران',
  [PERMISSIONS.ROLE_PERMISSION_MANAGE]: 'ویرایش ماتریس دسترسی',
  [PERMISSIONS.SUBSCRIBER_VIEW]: 'مشاهده مشترکین',
  [PERMISSIONS.SUBSCRIBER_MANAGE]: 'مدیریت مشترکین',
  [PERMISSIONS.ADVERTISER_VIEW]: 'مشاهده آگهی‌دهندگان',
  [PERMISSIONS.ADVERTISER_MANAGE]: 'مدیریت آگهی‌دهندگان',
  [PERMISSIONS.CONTRIBUTOR_VIEW]: 'مشاهده همکاران',
  [PERMISSIONS.CONTRIBUTOR_MANAGE]: 'مدیریت همکاران',
  [PERMISSIONS.COMMISSION_MANAGE]: 'مدیریت سفارش مطلب',
  [PERMISSIONS.MESSAGE_VIEW]: 'مشاهده پیام‌ها',
  [PERMISSIONS.MESSAGE_MANAGE]: 'مدیریت پیام‌ها',
  [PERMISSIONS.TICKET_VIEW]: 'مشاهده تیکت‌ها',
  [PERMISSIONS.TICKET_MANAGE]: 'مدیریت تیکت‌ها',
  [PERMISSIONS.CHAT_VIEW]: 'مشاهده چت آنلاین',
  [PERMISSIONS.CHAT_MANAGE]: 'پاسخ و مدیریت چت آنلاین',
  [PERMISSIONS.GEO_VIEW]: 'مشاهده تحلیل جغرافیایی',
  [PERMISSIONS.GEO_EXPORT]: 'خروجی تحلیل جغرافیایی',
  [PERMISSIONS.FINANCE_VIEW]: 'مشاهده مالی',
  [PERMISSIONS.FINANCE_MANAGE]: 'مدیریت مالی',
  [PERMISSIONS.FINANCE_EXPORT]: 'خروجی مالی',
  [PERMISSIONS.DISCOUNT_VIEW]: 'مشاهده تخفیف‌ها',
  [PERMISSIONS.DISCOUNT_MANAGE]: 'مدیریت تخفیف‌ها',
  [PERMISSIONS.SETTINGS_VIEW]: 'مشاهده تنظیمات',
  [PERMISSIONS.SETTINGS_EDIT]: 'ویرایش تنظیمات',
  [PERMISSIONS.SECURITY_VIEW]: 'مشاهده امنیت',
  [PERMISSIONS.SECURITY_MANAGE]: 'مدیریت امنیت',
  [PERMISSIONS.AUDIT_VIEW]: 'مشاهده لاگ',
};

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: 'عمومی',
    permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.AUDIT_VIEW],
  },
  {
    label: 'محتوا',
    permissions: [
      PERMISSIONS.ARTICLE_VIEW,
      PERMISSIONS.ARTICLE_CREATE,
      PERMISSIONS.ARTICLE_EDIT,
      PERMISSIONS.ARTICLE_DELETE,
      PERMISSIONS.ARTICLE_PUBLISH,
      PERMISSIONS.COMMENT_VIEW,
      PERMISSIONS.COMMENT_MODERATE,
      PERMISSIONS.ISSUE_VIEW,
      PERMISSIONS.ISSUE_CREATE,
      PERMISSIONS.ISSUE_EDIT,
      PERMISSIONS.ISSUE_DELETE,
      PERMISSIONS.CATEGORY_MANAGE,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.PLAN_VIEW,
      PERMISSIONS.PLAN_MANAGE,
    ],
  },
  {
    label: 'کاربران و دسترسی',
    permissions: [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_EDIT,
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.ROLE_PERMISSION_MANAGE,
    ],
  },
  {
    label: 'مشتریان',
    permissions: [
      PERMISSIONS.SUBSCRIBER_VIEW,
      PERMISSIONS.SUBSCRIBER_MANAGE,
      PERMISSIONS.ADVERTISER_VIEW,
      PERMISSIONS.ADVERTISER_MANAGE,
      PERMISSIONS.MESSAGE_VIEW,
      PERMISSIONS.MESSAGE_MANAGE,
      PERMISSIONS.TICKET_VIEW,
      PERMISSIONS.TICKET_MANAGE,
      PERMISSIONS.CHAT_VIEW,
      PERMISSIONS.CHAT_MANAGE,
      PERMISSIONS.GEO_VIEW,
      PERMISSIONS.GEO_EXPORT,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.FINANCE_MANAGE,
      PERMISSIONS.FINANCE_EXPORT,
      PERMISSIONS.DISCOUNT_VIEW,
      PERMISSIONS.DISCOUNT_MANAGE,
    ],
  },
  {
    label: 'همکاران',
    permissions: [
      PERMISSIONS.CONTRIBUTOR_VIEW,
      PERMISSIONS.CONTRIBUTOR_MANAGE,
      PERMISSIONS.COMMISSION_MANAGE,
    ],
  },
  {
    label: 'سیستم',
    permissions: [
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_EDIT,
      PERMISSIONS.SECURITY_VIEW,
      PERMISSIONS.SECURITY_MANAGE,
    ],
  },
];

export function canAccessAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function hasPermission(role: UserRole, permission: Permission, matrix?: Record<UserRole, Permission[]>): boolean {
  const source = matrix ?? DEFAULT_ROLE_PERMISSIONS;
  return source[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
  matrix?: Record<UserRole, Permission[]>,
): boolean {
  return permissions.some((p) => hasPermission(role, p, matrix));
}

export function canCreateUsers(role: UserRole, matrix?: Record<UserRole, Permission[]>): boolean {
  return hasAnyPermission(role, [PERMISSIONS.USER_MANAGE, PERMISSIONS.USER_CREATE], matrix);
}

export function canEditUsers(role: UserRole, matrix?: Record<UserRole, Permission[]>): boolean {
  return hasAnyPermission(role, [PERMISSIONS.USER_MANAGE, PERMISSIONS.USER_EDIT], matrix);
}

export function canManageRolePermissions(role: UserRole, matrix?: Record<UserRole, Permission[]>): boolean {
  return hasPermission(role, PERMISSIONS.ROLE_PERMISSION_MANAGE, matrix);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'مدیر کل',
  [UserRole.PUBLISHER]: 'صاحب امتیاز',
  [UserRole.MANAGING_DIRECTOR]: 'مدیرمسئول',
  [UserRole.EDITOR_IN_CHIEF]: 'سردبیر',
  [UserRole.COPY_EDITOR]: 'ویراستار',
  [UserRole.WRITER]: 'نویسنده',
  [UserRole.AD_MANAGER]: 'مسئول تبلیغات',
  [UserRole.SUBSCRIBER]: 'مشترک',
};

export const ADMIN_ROLE_OPTIONS = ADMIN_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));
