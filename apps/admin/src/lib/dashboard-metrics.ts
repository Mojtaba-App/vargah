import { ArticleStatus, SubscriptionStatus, PaymentStatus, prisma } from '@vargah/database';
import { UserRole } from '@vargah/database/enums';

import { getAdminAlerts, type AdminAlert } from '@/lib/admin-alerts';
import { buildDashboardScope, type DashboardScope } from '@/lib/dashboard-scope';
import { PERMISSIONS, type Permission } from '@/lib/permissions';

const SOURCE_LABELS: Record<string, string> = {
  direct: 'مستقیم',
  organic: 'جستجو',
  social: 'شبکه اجتماعی',
  referral: 'ارجاع',
  email: 'ایمیل',
};

export function formatTrafficSource(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

export type DashboardNotification = AdminAlert;

export type DashboardQuickAction = {
  href: string;
  label: string;
  description: string;
  tone: 'primary' | 'neutral' | 'accent';
};

type DashboardQuickActionDef = DashboardQuickAction & {
  permission: Permission;
};

export type DashboardMetrics = {
  scope: DashboardScope;
  stats: {
    weeklyViews: number | null;
    viewsChange: number | null;
    publishedArticles: number | null;
    articlesThisMonth: number | null;
    activeSubscribers: number | null;
    newSubscribersThisMonth: number | null;
    monthlyRevenue: number | null;
    revenueChange: number | null;
  };
  notifications: DashboardNotification[];
  chartData: { date: string; visitors: number; pageViews: number }[];
  trafficSources: { source: string; views: number }[];
  topArticles: { id: string; title: string; slug: string; views: number }[];
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    userName: string;
    createdAt: Date;
  }[];
  quickActions: DashboardQuickAction[];
};

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

const QUICK_ACTIONS: DashboardQuickActionDef[] = [
  {
    href: '/content/articles/new',
    label: 'مطلب جدید',
    description: 'ایجاد و انتشار مقاله',
    tone: 'primary',
    permission: PERMISSIONS.ARTICLE_CREATE,
  },
  {
    href: '/content/issues/new',
    label: 'شماره جدید',
    description: 'افزودن شماره ماهنامه',
    tone: 'accent',
    permission: PERMISSIONS.ISSUE_CREATE,
  },
  {
    href: '/messages',
    label: 'پیام‌ها',
    description: 'بررسی مکاتبات ورودی',
    tone: 'neutral',
    permission: PERMISSIONS.MESSAGE_VIEW,
  },
  {
    href: '/content/media',
    label: 'کتابخانه رسانه',
    description: 'مدیریت تصاویر و فایل‌ها',
    tone: 'neutral',
    permission: PERMISSIONS.MEDIA_MANAGE,
  },
];

export async function getDashboardMetrics(
  userId: string,
  role: UserRole,
  permissions: Permission[],
): Promise<DashboardMetrics> {
  const scope = buildDashboardScope(userId, role, permissions);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since14 = new Date();
  since14.setDate(since14.getDate() - 14);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const articleWhere = scope.scopeArticlesToAuthor ? { authorId: userId } : {};
  const publishedWhere = { ...articleWhere, status: ArticleStatus.PUBLISHED };
  const publishedThisMonthWhere = {
    ...publishedWhere,
    publishedAt: { gte: monthStart },
  };

  const [
    publishedArticles,
    articlesThisMonth,
    activeSubscribers,
    newSubscribersThisMonth,
    monthlyRevenue,
    lastMonthRevenue,
    trafficLast7,
    trafficPrev7,
    trafficStats,
    recentAudit,
    topArticlesRaw,
    trafficSourcesRaw,
    notificationsRaw,
  ] = await Promise.all([
    scope.showArticles ? prisma.article.count({ where: publishedWhere }) : Promise.resolve(null),
    scope.showArticles
      ? prisma.article.count({ where: publishedThisMonthWhere })
      : Promise.resolve(null),
    scope.showSubscribers
      ? prisma.subscriber.count({ where: { status: SubscriptionStatus.ACTIVE } })
      : Promise.resolve(null),
    scope.showSubscribers
      ? prisma.subscriber.count({ where: { createdAt: { gte: monthStart } } })
      : Promise.resolve(null),
    scope.showFinance
      ? prisma.payment.aggregate({
          where: { status: PaymentStatus.PAID, paidAt: { gte: monthStart } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    scope.showFinance
      ? prisma.payment.aggregate({
          where: {
            status: PaymentStatus.PAID,
            paidAt: { gte: lastMonthStart, lte: lastMonthEnd },
          },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    scope.showTraffic
      ? prisma.trafficStat.aggregate({
          where: { date: { gte: since7 } },
          _sum: { pageViews: true },
        })
      : Promise.resolve(null),
    scope.showTraffic
      ? prisma.trafficStat.aggregate({
          where: { date: { gte: since14, lt: since7 } },
          _sum: { pageViews: true },
        })
      : Promise.resolve(null),
    scope.showTraffic
      ? prisma.trafficStat.findMany({ orderBy: { date: 'asc' }, take: 7 })
      : Promise.resolve([]),
    prisma.auditLog.findMany({
      where: scope.isSuperAdmin ? undefined : { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
    scope.showTopArticles
      ? (async () => {
          if (scope.scopeArticlesToAuthor) {
            const authorArticles = await prisma.article.findMany({
              where: { authorId: userId },
              select: { id: true },
            });
            const authorArticleIds = authorArticles.map((article) => article.id);
            if (authorArticleIds.length === 0) return [];
            return prisma.pageView.groupBy({
              by: ['articleId'],
              where: {
                articleId: { in: authorArticleIds },
                createdAt: { gte: since30 },
              },
              _count: { _all: true },
              orderBy: { _count: { articleId: 'desc' } },
              take: 8,
            });
          }
          return prisma.pageView.groupBy({
            by: ['articleId'],
            where: { articleId: { not: null }, createdAt: { gte: since30 } },
            _count: { _all: true },
            orderBy: { _count: { articleId: 'desc' } },
            take: 8,
          });
        })()
      : Promise.resolve([]),
    scope.showTrafficSources
      ? prisma.pageView.groupBy({
          by: ['source'],
          where: { createdAt: { gte: since30 } },
          _count: { _all: true },
          orderBy: { _count: { source: 'desc' } },
          take: 6,
        })
      : Promise.resolve([]),
    getAdminAlerts(userId, permissions),
  ]);

  const articleIds = topArticlesRaw
    .map((r) => r.articleId)
    .filter((id): id is string => Boolean(id));

  const topArticleRows = articleIds.length
    ? await prisma.article.findMany({
        where: {
          id: { in: articleIds },
          ...(scope.scopeArticlesToAuthor ? { authorId: userId } : {}),
        },
        select: { id: true, title: true, slug: true },
      })
    : [];

  const topArticles = topArticlesRaw
    .map((row) => {
      const article = topArticleRows.find((a) => a.id === row.articleId);
      if (!article) return null;
      return { ...article, views: row._count._all };
    })
    .filter(Boolean) as DashboardMetrics['topArticles'];

  const weeklyViews = trafficLast7?._sum.pageViews ?? 0;
  const prevWeeklyViews = trafficPrev7?._sum.pageViews ?? 0;
  const currentRevenue = Number(monthlyRevenue?._sum.amount ?? 0);
  const previousRevenue = Number(lastMonthRevenue?._sum.amount ?? 0);

  const quickActions = QUICK_ACTIONS.filter((action) =>
    permissions.includes(action.permission),
  ).map(({ permission: _permission, ...action }) => action);

  return {
    scope,
    stats: {
      weeklyViews: scope.showTraffic ? weeklyViews : null,
      viewsChange: scope.showTraffic ? percentChange(weeklyViews, prevWeeklyViews) : null,
      publishedArticles,
      articlesThisMonth,
      activeSubscribers,
      newSubscribersThisMonth,
      monthlyRevenue: scope.showFinance ? currentRevenue : null,
      revenueChange: scope.showFinance ? percentChange(currentRevenue, previousRevenue) : null,
    },
    notifications: notificationsRaw,
    chartData: trafficStats.map((s) => ({
      date: new Intl.DateTimeFormat('fa-IR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(s.date),
      visitors: s.visitors,
      pageViews: s.pageViews,
    })),
    trafficSources: trafficSourcesRaw.map((r) => ({
      source: r.source,
      views: r._count._all,
    })),
    topArticles,
    recentActivity: recentAudit.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      userName: log.user?.name ?? 'سیستم',
      createdAt: log.createdAt,
    })),
    quickActions,
  };
}
