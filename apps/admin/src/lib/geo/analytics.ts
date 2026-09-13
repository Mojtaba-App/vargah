import { prisma } from '@vargah/database';

export type GeoTrendPoint = {
  date: string;
  label: string;
  newSubscribers: number;
  activeSubscribers: number;
};

export type GeoCityGrowth = {
  cityId: string;
  city: string;
  province: string;
  growth: number;
  total: number;
};

export type GeoAnalytics = {
  trend: GeoTrendPoint[];
  topGrowthCities: GeoCityGrowth[];
  lastAggregatedAt: string | null;
};

function formatJalaliShort(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(date);
}

export async function getGeoAnalytics(days = 30): Promise<GeoAnalytics> {
  const safeDays = Math.max(7, Math.min(days, 90));
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (safeDays - 1));

  const [rows, lastRow] = await Promise.all([
    prisma.geoStatsDaily.groupBy({
      by: ['date'],
      where: { date: { gte: since } },
      _sum: {
        subscribersNew: true,
        subscribersActive: true,
      },
      orderBy: { date: 'asc' },
    }),
    prisma.geoStatsDaily.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  const trend: GeoTrendPoint[] = rows.map((row: (typeof rows)[number]) => ({
    date: row.date.toISOString().slice(0, 10),
    label: formatJalaliShort(row.date),
    newSubscribers: row._sum.subscribersNew ?? 0,
    activeSubscribers: row._sum.subscribersActive ?? 0,
  }));

  const growthSince = new Date(since);
  const cityGrowth = await prisma.geoStatsDaily.groupBy({
    by: ['cityId'],
    where: { date: { gte: growthSince } },
    _sum: { subscribersNew: true },
    orderBy: { _sum: { subscribersNew: 'desc' } },
    take: 10,
  });

  const cityIds = cityGrowth.map((row: (typeof cityGrowth)[number]) => row.cityId);
  const cityRows = cityIds.length
    ? await prisma.iranCity.findMany({ where: { id: { in: cityIds } } })
    : [];
  const cityMap = new Map(cityRows.map((row) => [row.id, row]));

  const latestByCity = cityIds.length
    ? await prisma.geoStatsDaily.groupBy({
        by: ['cityId'],
        where: { cityId: { in: cityIds } },
        _max: { date: true },
      })
    : [];

  const latestDates = latestByCity
    .map((row: (typeof latestByCity)[number]) => row._max.date)
    .filter((date): date is Date => Boolean(date));
  const latestStats =
    latestDates.length && cityIds.length
      ? await prisma.geoStatsDaily.findMany({
          where: {
            cityId: { in: cityIds },
            date: { in: latestDates },
          },
        })
      : [];
  const latestMap = new Map(latestStats.map((row) => [row.cityId, row.subscribersTotal]));

  const topGrowthCities: GeoCityGrowth[] = cityGrowth
    .map((row: (typeof cityGrowth)[number]) => {
      const city = cityMap.get(row.cityId);
      if (!city) return null;
      return {
        cityId: row.cityId,
        city: city.name,
        province: city.province,
        growth: row._sum.subscribersNew ?? 0,
        total: latestMap.get(row.cityId) ?? 0,
      };
    })
    .filter((row): row is GeoCityGrowth => Boolean(row));

  return {
    trend,
    topGrowthCities,
    lastAggregatedAt: lastRow?.createdAt.toISOString() ?? null,
  };
}

export async function getCityGrowthMap(days = 30): Promise<Map<string, number>> {
  const safeDays = Math.max(7, Math.min(days, 90));
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (safeDays - 1));

  const rows = await prisma.geoStatsDaily.groupBy({
    by: ['cityId'],
    where: { date: { gte: since } },
    _sum: { subscribersNew: true },
  });

  return new Map(
    rows.map((row: (typeof rows)[number]) => [row.cityId, row._sum.subscribersNew ?? 0]),
  );
}
