import { SubscriptionStatus, prisma } from '@vargah/database';

export type GeoStatsAggregateResult = {
  date: string;
  citiesProcessed: number;
  rowsUpserted: number;
};

export type GeoStatsBackfillResult = {
  datesProcessed: number;
  totalRows: number;
};

function utcDayStart(input: Date): Date {
  const date = new Date(input);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function utcDayEnd(input: Date): Date {
  const date = utcDayStart(input);
  date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCMilliseconds(date.getUTCMilliseconds() - 1);
  return date;
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Aggregate subscriber counts per city for a single UTC day. */
export async function aggregateGeoStatsForDate(input: Date): Promise<GeoStatsAggregateResult> {
  const date = utcDayStart(input);
  const dayEnd = utcDayEnd(date);
  const dayStart = date;

  const cities = await prisma.iranCity.findMany({
    select: { id: true, province: true },
  });

  let rowsUpserted = 0;

  for (const city of cities) {
    const [subscribersActive, subscribersNew, subscribersTotal] = await Promise.all([
      prisma.subscriber.count({
        where: {
          cityId: city.id,
          status: SubscriptionStatus.ACTIVE,
          createdAt: { lte: dayEnd },
        },
      }),
      prisma.subscriber.count({
        where: {
          cityId: city.id,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.subscriber.count({
        where: {
          cityId: city.id,
          createdAt: { lte: dayEnd },
        },
      }),
    ]);

    if (subscribersActive === 0 && subscribersNew === 0 && subscribersTotal === 0) {
      continue;
    }

    await prisma.geoStatsDaily.upsert({
      where: {
        date_cityId: { date, cityId: city.id },
      },
      create: {
        date,
        cityId: city.id,
        province: city.province,
        subscribersActive,
        subscribersNew,
        subscribersTotal,
      },
      update: {
        province: city.province,
        subscribersActive,
        subscribersNew,
        subscribersTotal,
      },
    });

    rowsUpserted += 1;
  }

  return {
    date: formatDateKey(date),
    citiesProcessed: cities.length,
    rowsUpserted,
  };
}

/** Backfill daily geo stats for the last N days (inclusive of today). */
export async function backfillGeoStats(days: number): Promise<GeoStatsBackfillResult> {
  const safeDays = Math.max(1, Math.min(days, 366));
  let totalRows = 0;

  for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
    const date = utcDayStart(new Date());
    date.setUTCDate(date.getUTCDate() - offset);
    const result = await aggregateGeoStatsForDate(date);
    totalRows += result.rowsUpserted;
  }

  return { datesProcessed: safeDays, totalRows };
}

/** Nightly job: aggregate yesterday and today (handles late updates). */
export async function runGeoStatsJob(): Promise<GeoStatsAggregateResult[]> {
  const today = utcDayStart(new Date());
  const yesterday = utcDayStart(new Date());
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  return Promise.all([aggregateGeoStatsForDate(yesterday), aggregateGeoStatsForDate(today)]);
}
