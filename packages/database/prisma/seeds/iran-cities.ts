import { buildIranCityCatalog } from '@vargah/business/iran-geo';
import { resolveIranCityId } from '@vargah/business/iran-geo';

import type { SeedContext } from './types';

export async function seedIranCities(ctx: SeedContext) {
  const { prisma } = ctx;
  const catalog = buildIranCityCatalog();

  for (const city of catalog) {
    await prisma.iranCity.upsert({
      where: { id: city.id },
      update: {
        province: city.province,
        name: city.name,
        lat: city.lat,
        lng: city.lng,
      },
      create: city,
    });
  }

  const subscribers = await prisma.subscriber.findMany({
    where: {
      cityId: null,
      province: { not: null },
      city: { not: null },
    },
    select: { id: true, province: true, city: true },
  });

  for (const row of subscribers) {
    const cityId = resolveIranCityId(row.province, row.city);
    if (!cityId) continue;
    await prisma.subscriber.update({
      where: { id: row.id },
      data: { cityId },
    });
  }

  const advertisers = await prisma.advertiser.findMany({
    where: {
      cityId: null,
      province: { not: null },
      city: { not: null },
    },
    select: { id: true, province: true, city: true },
  });

  for (const row of advertisers) {
    const cityId = resolveIranCityId(row.province, row.city);
    if (!cityId) continue;
    await prisma.advertiser.update({
      where: { id: row.id },
      data: { cityId },
    });
  }

  console.log(`   🗺️  geo — ${catalog.length} شهر ایران + هم‌ترازی cityId مشترکین/آگهی‌دهندگان`);
}
