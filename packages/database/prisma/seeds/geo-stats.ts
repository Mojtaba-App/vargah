import { SubscriptionStatus } from '@prisma/client';

import type { SeedContext } from './types';

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

async function aggregateGeoStatsForDate(ctx: SeedContext, input: Date) {
  const date = utcDayStart(input);
  const dayEnd = utcDayEnd(date);
  const dayStart = date;

  const cities = await ctx.prisma.iranCity.findMany({
    select: { id: true, province: true },
  });

  let rowsUpserted = 0;

  for (const city of cities) {
    const [subscribersActive, subscribersNew, subscribersTotal] = await Promise.all([
      ctx.prisma.subscriber.count({
        where: {
          cityId: city.id,
          status: SubscriptionStatus.ACTIVE,
          createdAt: { lte: dayEnd },
        },
      }),
      ctx.prisma.subscriber.count({
        where: {
          cityId: city.id,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      ctx.prisma.subscriber.count({
        where: {
          cityId: city.id,
          createdAt: { lte: dayEnd },
        },
      }),
    ]);

    if (subscribersActive === 0 && subscribersNew === 0 && subscribersTotal === 0) continue;

    await ctx.prisma.geoStatsDaily.upsert({
      where: { date_cityId: { date, cityId: city.id } },
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

  return rowsUpserted;
}

export async function seedGeoStats(ctx: SeedContext) {
  const subscriberCount = await ctx.prisma.subscriber.count();
  if (subscriberCount === 0) {
    console.log('   🗺️ geo-stats — بدون مشترک، رد شد');
    return;
  }

  let totalRows = 0;
  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = utcDayStart(new Date());
    date.setUTCDate(date.getUTCDate() - offset);
    totalRows += await aggregateGeoStatsForDate(ctx, date);
  }

  console.log(`   🗺️ geo-stats — 30 روز، ${totalRows} ردیف`);
}
