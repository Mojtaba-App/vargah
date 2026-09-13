import { UserRole } from '@vargah/database/enums';

import { PERMISSIONS, type Permission, isFullAccessRole } from '@/lib/permissions';

export type DashboardScope = {
  userId: string;
  isSuperAdmin: boolean;
  showTraffic: boolean;
  showArticles: boolean;
  showSubscribers: boolean;
  showFinance: boolean;
  showTopArticles: boolean;
  showTrafficSources: boolean;
  scopeArticlesToAuthor: boolean;
};

export function buildDashboardScope(
  userId: string,
  role: UserRole,
  permissions: Permission[],
): DashboardScope {
  const isSuperAdmin = isFullAccessRole(role);
  const has = (permission: Permission) => permissions.includes(permission);

  return {
    userId,
    isSuperAdmin,
    showTraffic: isSuperAdmin,
    showArticles: has(PERMISSIONS.ARTICLE_VIEW),
    showSubscribers: has(PERMISSIONS.SUBSCRIBER_VIEW),
    showFinance: has(PERMISSIONS.FINANCE_VIEW),
    showTopArticles: has(PERMISSIONS.ARTICLE_VIEW),
    showTrafficSources: isSuperAdmin,
    scopeArticlesToAuthor: !isSuperAdmin && role === UserRole.WRITER,
  };
}
