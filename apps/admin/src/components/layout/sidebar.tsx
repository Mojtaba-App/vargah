'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@vargah/database/enums';

import { BrandLogoMark } from '@/components/brand-logo';
import {
  BookOpenIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  CheckSquareIcon,
  FileTextIcon,
  GitBranchIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LayersIcon,
  MapIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  PanelRightCloseIcon,
  PanelRightIcon,
  PenLineIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  StarIcon,
  TagsIcon,
  TicketIcon,
  UserCircleIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/layout/nav-icons';
import { SidebarFooter } from '@/components/layout/sidebar-footer';
import { PERMISSIONS, hasPermission, type Permission } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type NavIcon = React.ComponentType<{ className?: string }>;

type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  permission?: Permission;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'داشبورد', icon: LayoutDashboardIcon, permission: PERMISSIONS.DASHBOARD_VIEW },
  {
    href: '/content',
    label: 'مدیریت محتوا',
    icon: LayersIcon,
    children: [
      { href: '/content/articles', label: 'مقالات', icon: FileTextIcon, permission: PERMISSIONS.ARTICLE_VIEW },
      { href: '/content/comments', label: 'نظرات', icon: MessageSquareIcon, permission: PERMISSIONS.COMMENT_VIEW },
      { href: '/content/issues', label: 'شماره‌ها', icon: BookOpenIcon, permission: PERMISSIONS.ISSUE_VIEW },
      { href: '/content/categories', label: 'دسته‌بندی‌ها', icon: TagsIcon, permission: PERMISSIONS.CATEGORY_MANAGE },
      { href: '/content/media', label: 'رسانه', icon: ImageIcon, permission: PERMISSIONS.MEDIA_MANAGE },
      {
        href: '/subscription-plans',
        label: 'پلن‌های اشتراک',
        icon: StarIcon,
        permission: PERMISSIONS.PLAN_VIEW,
      },
      {
        href: '/discounts',
        label: 'تخفیف‌ها',
        icon: TagsIcon,
        permission: PERMISSIONS.DISCOUNT_VIEW,
      },
    ],
  },
  {
    href: '/users',
    label: 'کاربران و دسترسی',
    icon: UsersIcon,
    children: [
      { href: '/users', label: 'لیست کاربران', icon: UserIcon, permission: PERMISSIONS.USER_VIEW },
      { href: '/users/permissions', label: 'ماتریس دسترسی', icon: ShieldCheckIcon, permission: PERMISSIONS.ROLE_PERMISSION_MANAGE },
      { href: '/users/audit', label: 'لاگ فعالیت', icon: ScrollTextIcon, permission: PERMISSIONS.AUDIT_VIEW },
    ],
  },
  {
    href: '/crm',
    label: 'مشتریان',
    icon: BriefcaseIcon,
    children: [
      { href: '/crm/subscribers', label: 'مشترکین', icon: StarIcon, permission: PERMISSIONS.SUBSCRIBER_VIEW },
      { href: '/crm/advertisers', label: 'آگهی‌دهندگان', icon: MegaphoneIcon, permission: PERMISSIONS.ADVERTISER_VIEW },
      { href: '/crm/tickets', label: 'تیکت‌ها', icon: TicketIcon, permission: PERMISSIONS.TICKET_VIEW },
      { href: '/crm/surveys', label: 'رضایت‌سنجی', icon: ChartIcon, permission: PERMISSIONS.TICKET_VIEW },
    ],
  },
  {
    href: '/contributors',
    label: 'همکاران',
    icon: PenLineIcon,
    children: [
      { href: '/contributors', label: 'پروفایل‌ها', icon: UserCircleIcon, permission: PERMISSIONS.CONTRIBUTOR_VIEW },
      { href: '/contributors/workflow', label: 'گردش کار مطلب', icon: GitBranchIcon, permission: PERMISSIONS.CONTRIBUTOR_MANAGE },
      { href: '/contributors/tasks', label: 'وظایف', icon: CheckSquareIcon, permission: PERMISSIONS.CONTRIBUTOR_MANAGE },
      { href: '/contributors/calendar', label: 'تقویم تحریریه', icon: CalendarIcon, permission: PERMISSIONS.CONTRIBUTOR_VIEW },
    ],
  },
  {
    href: '/geo',
    label: 'تحلیل جغرافیایی',
    icon: MapIcon,
    permission: PERMISSIONS.GEO_VIEW,
  },
  {
    href: '/messages',
    label: 'پیام‌رسانی',
    icon: MessageSquareIcon,
    children: [
      { href: '/messages', label: 'صندوق ورودی', icon: MessageSquareIcon, permission: PERMISSIONS.MESSAGE_VIEW },
      {
        href: '/messages/chat',
        label: 'چت آنلاین',
        icon: MessageSquareIcon,
        permission: PERMISSIONS.CHAT_VIEW,
      },
      {
        href: '/messages/campaigns',
        label: 'ارسال دسته‌ای',
        icon: MegaphoneIcon,
        permission: PERMISSIONS.MESSAGE_VIEW,
      },
      {
        href: '/messages/newsletter',
        label: 'خبرنامه',
        icon: StarIcon,
        permission: PERMISSIONS.MESSAGE_VIEW,
      },
    ],
  },
  {
    href: '/finance',
    label: 'مالی',
    icon: WalletIcon,
    permission: PERMISSIONS.FINANCE_VIEW,
  },
  {
    href: '/settings',
    label: 'تنظیمات',
    icon: SettingsIcon,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
  {
    href: '/security',
    label: 'امنیت',
    icon: ShieldIcon,
    permission: PERMISSIONS.SECURITY_VIEW,
  },
];

type SidebarProps = {
  role: UserRole;
  grantedPermissions?: Permission[];
  branding: {
    siteName: string;
    adminLogo: string;
  };
  collapsed: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onToggle: () => void;
};

function isNavItemActive(pathname: string, href: string, siblingHrefs: string[] = []) {
  if (href === '/') return pathname === '/';
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;

  const hasMoreSpecificSibling = siblingHrefs.some(
    (sibling) =>
      sibling !== href &&
      sibling.startsWith(`${href}/`) &&
      (pathname === sibling || pathname.startsWith(`${sibling}/`)),
  );

  return !hasMoreSpecificSibling;
}

function isSectionActive(pathname: string, item: NavItem) {
  if (!item.children?.length) return false;
  const siblingHrefs = item.children.map((child) => child.href);
  return item.children.some((child) => isNavItemActive(pathname, child.href, siblingHrefs));
}

export function Sidebar({
  role,
  grantedPermissions,
  branding,
  collapsed,
  mobileOpen = false,
  onMobileClose,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    onMobileClose?.();
  }, [pathname]);

  const isAllowed = (permission?: Permission) => {
    if (!permission) return true;
    if (grantedPermissions) return grantedPermissions.includes(permission);
    return hasPermission(role, permission);
  };

  const filterItems = (items: NavItem[]): NavItem[] =>
    items
      .filter((item) => isAllowed(item.permission))
      .map((item) => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined,
      }))
      .filter((item) => !item.children || item.children.length > 0);

  const visibleItems = filterItems(NAV_ITEMS);

  return (
    <aside
      className={cn(
        'fixed start-0 top-0 z-40 flex h-screen flex-col border-e border-brand-800/40 bg-brand-950 text-[#eef7f6] shadow-xl shadow-brand-950/30 transition-all duration-300 dark:border-white/10 dark:bg-[#071c1a] dark:shadow-black/40',
        'w-64 max-lg:transition-transform',
        mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full',
        'lg:translate-x-0',
        collapsed ? 'lg:w-[4.25rem]' : 'lg:w-64',
      )}
      aria-label="منوی پنل مدیریت"
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-brand-800/50',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandLogoMark size="sm" src={branding.adminLogo} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{branding.siteName}</p>
              <p className="truncate text-[11px] text-white/70">پنل مدیریت</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
        >
          {collapsed ? (
            <PanelRightIcon className="size-5" />
          ) : (
            <PanelRightCloseIcon className="size-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-2">
          {visibleItems.map((item) => (
            <li key={item.href}>
              {item.children ? (
                <NavSection item={item} pathname={pathname} collapsed={collapsed} />
              ) : (
                <MainNavLink item={item} pathname={pathname} collapsed={collapsed} />
              )}
            </li>
          ))}
        </ul>
      </nav>

      <SidebarFooter collapsed={collapsed} />
    </aside>
  );
}

function NavSection({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const sectionActive = isSectionActive(pathname, item);
  const Icon = item.icon;
  const siblingHrefs = item.children?.map((child) => child.href) ?? [];

  if (collapsed) {
    return (
      <div className="space-y-1">
        <div
          className={cn(
            'flex justify-center rounded-xl p-2 text-white/75',
            sectionActive && 'bg-brand-400/15 text-white',
          )}
          title={item.label}
        >
          <Icon className="size-5" />
        </div>
        <ul className="space-y-1">
          {item.children?.map((child) => (
            <li key={child.href}>
              <SubNavLink
                item={child}
                pathname={pathname}
                collapsed
                siblingHrefs={siblingHrefs}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section
      className={cn(
        'rounded-2xl border transition-colors',
        sectionActive
          ? 'border-brand-400/25 bg-brand-400/10'
          : 'border-transparent bg-transparent',
      )}
      aria-label={item.label}
    >
      <div
        className={cn(
          'flex items-center gap-2.5 px-3 py-2.5',
          sectionActive ? 'text-white' : 'text-white/85',
        )}
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            sectionActive ? 'bg-brand-400/25 text-white' : 'bg-white/10 text-white/80',
          )}
        >
          <Icon className="size-[1.125rem]" />
        </span>
        <span className="truncate text-sm font-bold">{item.label}</span>
      </div>

      <ul className="relative space-y-0.5 pb-2 pe-2 ps-5">
        <span
          className={cn(
            'absolute bottom-2 start-[1.35rem] top-0 w-px',
            sectionActive ? 'bg-brand-300/50' : 'bg-white/15',
          )}
          aria-hidden="true"
        />
        {item.children?.map((child) => (
          <li key={child.href} className="relative">
            <SubNavLink
              item={child}
              pathname={pathname}
              collapsed={false}
              siblingHrefs={siblingHrefs}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function MainNavLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all',
        isActive
          ? 'bg-brand-400 text-brand-950 shadow-sm shadow-brand-950/30'
          : 'text-white/90 hover:bg-white/10 hover:text-white',
        collapsed && 'justify-center px-2',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          isActive
            ? 'bg-brand-950/15 text-brand-950'
            : 'bg-white/10 text-white/85 group-hover:bg-white/15 group-hover:text-white',
          collapsed && 'size-9',
        )}
      >
        <Icon className="size-[1.125rem]" />
      </span>
      {!collapsed && <span className="truncate text-sm font-bold">{item.label}</span>}
    </Link>
  );
}

function SubNavLink({
  item,
  pathname,
  collapsed,
  siblingHrefs,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  siblingHrefs: string[];
}) {
  const isActive = isNavItemActive(pathname, item.href, siblingHrefs);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-2 rounded-lg py-2 transition-all',
        collapsed ? 'justify-center px-2' : 'pe-2 ps-4',
        isActive
          ? 'bg-brand-400/20 font-semibold text-white shadow-[inset_-2px_0_0_0_#9ad4cf]'
          : 'text-white/75 hover:bg-white/10 hover:text-white',
      )}
    >
      <span
        className={cn(
          'absolute start-[0.4rem] top-1/2 size-1.5 -translate-y-1/2 rounded-full transition-colors',
          isActive ? 'bg-[#9ad4cf]' : 'bg-white/25 group-hover:bg-white/55',
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md transition-colors',
          collapsed ? 'size-9' : 'size-7',
          isActive
            ? 'bg-brand-400/25 text-white'
            : 'text-white/65 group-hover:text-white',
        )}
      >
        <Icon className={cn(collapsed ? 'size-[1.125rem]' : 'size-4')} />
      </span>
      {!collapsed && <span className="truncate text-[13px]">{item.label}</span>}
    </Link>
  );
}
