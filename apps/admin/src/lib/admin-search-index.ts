import { PERMISSIONS, type Permission } from '@/lib/permissions';

export type AdminSearchEntry = {
  href: string;
  label: string;
  group: string;
  keywords: string[];
  permission?: Permission;
};

export const ADMIN_SEARCH_INDEX: AdminSearchEntry[] = [
  {
    href: '/',
    label: 'داشبورد',
    group: 'عمومی',
    keywords: ['dashboard', 'home'],
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    href: '/content/articles',
    label: 'مقالات',
    group: 'محتوا',
    keywords: ['article', 'post', 'مطلب'],
    permission: PERMISSIONS.ARTICLE_VIEW,
  },
  {
    href: '/content/articles/new',
    label: 'مقاله جدید',
    group: 'محتوا',
    keywords: ['create', 'new'],
    permission: PERMISSIONS.ARTICLE_CREATE,
  },
  {
    href: '/content/comments',
    label: 'نظرات مقالات',
    group: 'محتوا',
    keywords: ['comment', 'moderation'],
    permission: PERMISSIONS.ARTICLE_VIEW,
  },
  {
    href: '/content/issues',
    label: 'شماره‌ها',
    group: 'محتوا',
    keywords: ['issue', 'magazine'],
    permission: PERMISSIONS.ISSUE_VIEW,
  },
  {
    href: '/content/categories',
    label: 'دسته‌بندی‌ها',
    group: 'محتوا',
    keywords: ['category', 'tag'],
    permission: PERMISSIONS.CATEGORY_MANAGE,
  },
  {
    href: '/content/media',
    label: 'رسانه',
    group: 'محتوا',
    keywords: ['media', 'image', 'file'],
    permission: PERMISSIONS.MEDIA_MANAGE,
  },
  {
    href: '/users',
    label: 'کاربران',
    group: 'دسترسی',
    keywords: ['user', 'admin'],
    permission: PERMISSIONS.USER_VIEW,
  },
  {
    href: '/users/permissions',
    label: 'ماتریس دسترسی',
    group: 'دسترسی',
    keywords: ['role', 'permission'],
    permission: PERMISSIONS.ROLE_PERMISSION_MANAGE,
  },
  {
    href: '/users/audit',
    label: 'لاگ فعالیت',
    group: 'دسترسی',
    keywords: ['audit', 'log'],
    permission: PERMISSIONS.AUDIT_VIEW,
  },
  {
    href: '/crm/subscribers',
    label: 'مشترکین',
    group: 'مشتریان',
    keywords: ['subscriber'],
    permission: PERMISSIONS.SUBSCRIBER_VIEW,
  },
  {
    href: '/crm/advertisers',
    label: 'آگهی‌دهندگان',
    group: 'مشتریان',
    keywords: ['advertiser', 'ad'],
    permission: PERMISSIONS.ADVERTISER_VIEW,
  },
  {
    href: '/crm/tickets',
    label: 'تیکت‌ها',
    group: 'مشتریان',
    keywords: ['ticket', 'support'],
    permission: PERMISSIONS.MESSAGE_VIEW,
  },
  {
    href: '/crm/surveys',
    label: 'رضایت‌سنجی',
    group: 'مشتریان',
    keywords: ['survey', 'satisfaction'],
    permission: PERMISSIONS.MESSAGE_VIEW,
  },
  {
    href: '/contributors',
    label: 'همکاران',
    group: 'همکاران',
    keywords: ['contributor', 'writer'],
    permission: PERMISSIONS.CONTRIBUTOR_VIEW,
  },
  {
    href: '/contributors/workflow',
    label: 'گردش کار مطلب',
    group: 'همکاران',
    keywords: ['commission', 'workflow'],
    permission: PERMISSIONS.CONTRIBUTOR_MANAGE,
  },
  {
    href: '/messages',
    label: 'پیام‌ها',
    group: 'ارتباطات',
    keywords: ['message', 'inbox', 'contact'],
    permission: PERMISSIONS.MESSAGE_VIEW,
  },
  {
    href: '/finance',
    label: 'مالی',
    group: 'مالی',
    keywords: ['finance', 'payment', 'revenue'],
    permission: PERMISSIONS.FINANCE_VIEW,
  },
  {
    href: '/subscription-plans',
    label: 'پلن‌های اشتراک',
    group: 'مدیریت محتوا',
    keywords: ['plan', 'subscription', 'پلن', 'اشتراک', 'فروش'],
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
  {
    href: '/discounts',
    label: 'تخفیف‌ها',
    group: 'مدیریت محتوا',
    keywords: ['discount', 'coupon', 'تخفیف', 'کد'],
    permission: PERMISSIONS.DISCOUNT_VIEW,
  },
  {
    href: '/settings',
    label: 'تنظیمات',
    group: 'سیستم',
    keywords: ['settings', 'config'],
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
  {
    href: '/security',
    label: 'امنیت',
    group: 'سیستم',
    keywords: ['security', '2fa', 'session'],
    permission: PERMISSIONS.SECURITY_VIEW,
  },
  { href: '/profile', label: 'پروفایل من', group: 'عمومی', keywords: ['profile', 'account'] },
];

export function filterAdminSearchIndex(
  query: string,
  grantedPermissions: Permission[],
): AdminSearchEntry[] {
  const q = query.trim().toLowerCase();
  const allowed = ADMIN_SEARCH_INDEX.filter(
    (entry) => !entry.permission || grantedPermissions.includes(entry.permission),
  );

  if (!q) return allowed.slice(0, 8);

  return allowed
    .filter((entry) => {
      const haystack = [entry.label, entry.group, ...entry.keywords].join(' ').toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, 12);
}
