import { SubscriptionStatus, prisma } from '@vargah/database';

export type GeoCityStat = {
  cityId: string;
  province: string;
  city: string;
  lat: number;
  lng: number;
  count: number;
};

export type GeoSummary = {
  totalWithCity: number;
  totalWithoutCity: number;
  topCity: { city: string; province: string; count: number } | null;
  provinceStats: Array<{ province: string; count: number }>;
  cities: GeoCityStat[];
};

export type GeoSubscriberFilter = 'active' | 'all';
export type GeoEntitySource = 'subscribers' | 'advertisers' | 'messages' | 'all';

type CityCountRow = { cityId: string; count: number };

async function countByCityForSubscribers(filter: GeoSubscriberFilter): Promise<{
  withCity: number;
  withoutCity: number;
  groups: CityCountRow[];
}> {
  const baseWhere = filter === 'active' ? { status: SubscriptionStatus.ACTIVE } : {};

  const [withCity, withoutCity, groups] = await Promise.all([
    prisma.subscriber.count({ where: { ...baseWhere, cityId: { not: null } } }),
    prisma.subscriber.count({ where: { ...baseWhere, cityId: null } }),
    prisma.subscriber.groupBy({
      by: ['cityId'],
      where: { ...baseWhere, cityId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { cityId: 'desc' } },
    }),
  ]);

  return {
    withCity,
    withoutCity,
    groups: groups
      .filter((group) => group.cityId)
      .map((group) => ({ cityId: group.cityId as string, count: group._count._all })),
  };
}

async function countByCityForAdvertisers(): Promise<{
  withCity: number;
  withoutCity: number;
  groups: CityCountRow[];
}> {
  const [withCity, withoutCity, groups] = await Promise.all([
    prisma.advertiser.count({ where: { cityId: { not: null } } }),
    prisma.advertiser.count({ where: { cityId: null } }),
    prisma.advertiser.groupBy({
      by: ['cityId'],
      where: { cityId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { cityId: 'desc' } },
    }),
  ]);

  return {
    withCity,
    withoutCity,
    groups: groups
      .filter((group) => group.cityId)
      .map((group) => ({ cityId: group.cityId as string, count: group._count._all })),
  };
}

async function countByCityForMessages(): Promise<{
  withCity: number;
  withoutCity: number;
  groups: CityCountRow[];
}> {
  const [withCity, withoutCity, groups] = await Promise.all([
    prisma.message.count({ where: { cityId: { not: null } } }),
    prisma.message.count({ where: { cityId: null } }),
    prisma.message.groupBy({
      by: ['cityId'],
      where: { cityId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { cityId: 'desc' } },
    }),
  ]);

  return {
    withCity,
    withoutCity,
    groups: groups
      .filter((group) => group.cityId)
      .map((group) => ({ cityId: group.cityId as string, count: group._count._all })),
  };
}

function mergeCityCounts(rows: CityCountRow[][]): CityCountRow[] {
  const totals = new Map<string, number>();
  for (const list of rows) {
    for (const row of list) {
      totals.set(row.cityId, (totals.get(row.cityId) ?? 0) + row.count);
    }
  }
  return [...totals.entries()]
    .map(([cityId, count]) => ({ cityId, count }))
    .sort((a, b) => b.count - a.count);
}

async function loadGeoCounts(
  source: GeoEntitySource,
  filter: GeoSubscriberFilter,
): Promise<{ withCity: number; withoutCity: number; groups: CityCountRow[] }> {
  if (source === 'subscribers') return countByCityForSubscribers(filter);
  if (source === 'advertisers') return countByCityForAdvertisers();
  if (source === 'messages') return countByCityForMessages();

  const [subscribers, advertisers, messages] = await Promise.all([
    countByCityForSubscribers(filter),
    countByCityForAdvertisers(),
    countByCityForMessages(),
  ]);

  return {
    withCity: subscribers.withCity + advertisers.withCity + messages.withCity,
    withoutCity: subscribers.withoutCity + advertisers.withoutCity + messages.withoutCity,
    groups: mergeCityCounts([subscribers.groups, advertisers.groups, messages.groups]),
  };
}

export async function getSubscriberGeoStats(filter: GeoSubscriberFilter): Promise<GeoSummary> {
  return getGeoStats('subscribers', filter);
}

export async function getGeoStats(
  source: GeoEntitySource,
  filter: GeoSubscriberFilter,
): Promise<GeoSummary> {
  const { withCity, withoutCity, groups } = await loadGeoCounts(source, filter);

  if (groups.length === 0) {
    return {
      totalWithCity: withCity,
      totalWithoutCity: withoutCity,
      topCity: null,
      provinceStats: [],
      cities: [],
    };
  }

  const cityIds = groups.map((group) => group.cityId);
  const cityRows = await prisma.iranCity.findMany({ where: { id: { in: cityIds } } });
  const cityMap = new Map(cityRows.map((row) => [row.id, row]));
  const countMap = new Map(groups.map((group) => [group.cityId, group.count]));

  const cities: GeoCityStat[] = [];
  const provinceTotals = new Map<string, number>();

  for (const group of groups) {
    const row = cityMap.get(group.cityId);
    if (!row) continue;
    cities.push({
      cityId: row.id,
      province: row.province,
      city: row.name,
      lat: row.lat,
      lng: row.lng,
      count: countMap.get(group.cityId) ?? 0,
    });
    provinceTotals.set(row.province, (provinceTotals.get(row.province) ?? 0) + group.count);
  }

  const provinceStats = [...provinceTotals.entries()]
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count);

  const top = cities[0];

  return {
    totalWithCity: withCity,
    totalWithoutCity: withoutCity,
    topCity: top ? { city: top.city, province: top.province, count: top.count } : null,
    provinceStats,
    cities,
  };
}
