import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import {
  EyeIcon,
  FileStackIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/dashboard/dashboard-icons';
import { DashboardNotifications } from '@/components/dashboard/dashboard-notifications';
import { QuickActionsPanel } from '@/components/dashboard/quick-actions-panel';
import { StatCard } from '@/components/dashboard/stat-card';
import { TopArticlesTable } from '@/components/dashboard/top-articles-table';
import { TrafficChart, TrafficSourcesChart } from '@/components/dashboard/traffic-chart';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { getDashboardMetrics } from '@/lib/dashboard-metrics';
import { getPermissionsForRole } from '@/lib/permissions-server';
import { PERMISSIONS } from '@/lib/permissions';
import { formatPrice } from '@/lib/utils';

export default async function DashboardPage() {
  await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
  const session = await requireAuth();
  const permissions = await getPermissionsForRole(session.user.role);
  const metrics = await getDashboardMetrics(session.user.id, session.user.role, permissions);
  const { scope } = metrics;

  const statCards = [
    scope.showTraffic && metrics.stats.weeklyViews !== null
      ? {
          key: 'traffic',
          title: 'بازدید ۷ روز اخیر',
          value: metrics.stats.weeklyViews,
          change: metrics.stats.viewsChange,
          icon: EyeIcon,
          tone: 'primary' as const,
        }
      : null,
    scope.showArticles && metrics.stats.publishedArticles !== null
      ? {
          key: 'articles',
          title: scope.scopeArticlesToAuthor ? 'مقالات منتشرشده من' : 'مقالات منتشرشده',
          value: metrics.stats.publishedArticles,
          hint: `${(metrics.stats.articlesThisMonth ?? 0).toLocaleString('fa-IR')} مورد در این ماه`,
          icon: FileStackIcon,
        }
      : null,
    scope.showSubscribers && metrics.stats.activeSubscribers !== null
      ? {
          key: 'subscribers',
          title: 'مشترکین فعال',
          value: metrics.stats.activeSubscribers,
          hint: `${(metrics.stats.newSubscribersThisMonth ?? 0).toLocaleString('fa-IR')} مشترک جدید`,
          icon: UsersIcon,
          tone: 'success' as const,
        }
      : null,
    scope.showFinance && metrics.stats.monthlyRevenue !== null
      ? {
          key: 'finance',
          title: 'درآمد ماه جاری',
          value: `${formatPrice(metrics.stats.monthlyRevenue)} ت`,
          change: metrics.stats.revenueChange,
          icon: WalletIcon,
          tone: 'warning' as const,
        }
      : null,
  ].filter(Boolean);

  const showSidebarPanels = metrics.notifications.length > 0 || metrics.quickActions.length > 0;
  const showMainChart = scope.showTraffic && metrics.chartData.length > 0;
  const showBottomRow = scope.showTopArticles || scope.showTrafficSources;

  return (
    <div className="space-y-6">
      <DashboardHeader userName={session.user.name} />

      {statCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) =>
            card ? (
              <StatCard
                key={card.key}
                title={card.title}
                value={card.value}
                change={card.change}
                hint={card.hint}
                icon={card.icon}
                tone={card.tone}
              />
            ) : null,
          )}
        </div>
      )}

      {(showMainChart || showSidebarPanels) && (
        <div className="grid gap-6 xl:grid-cols-3">
          {showMainChart ? (
            <div className="xl:col-span-2">
              <TrafficChart data={metrics.chartData} />
            </div>
          ) : null}
          {showSidebarPanels ? (
            <div className={showMainChart ? 'space-y-4' : 'space-y-4 xl:col-span-3'}>
              {metrics.notifications.length > 0 && (
                <DashboardNotifications items={metrics.notifications} />
              )}
              {metrics.quickActions.length > 0 && (
                <QuickActionsPanel actions={metrics.quickActions} />
              )}
            </div>
          ) : null}
        </div>
      )}

      {showBottomRow && (
        <div className="grid gap-6 lg:grid-cols-2">
          {scope.showTopArticles && <TopArticlesTable articles={metrics.topArticles} />}
          {scope.showTrafficSources && <TrafficSourcesChart data={metrics.trafficSources} />}
        </div>
      )}

      <ActivityFeed
        items={metrics.recentActivity}
        title={scope.isSuperAdmin ? 'آخرین فعالیت‌ها' : 'فعالیت‌های من'}
        showUserName={scope.isSuperAdmin}
      />
    </div>
  );
}
