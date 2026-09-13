'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { runGeoStatsJob, backfillGeoStats } from '@vargah/business/geo-stats';

import { requirePermission } from '@/lib/auth-utils';
import { getCityGrowthMap } from '@/lib/geo/analytics';
import { buildGeoReportCsv, geoExportFilename } from '@/lib/geo/export';
import { getGeoStats, type GeoEntitySource, type GeoSubscriberFilter } from '@/lib/geo/stats';
import { PERMISSIONS } from '@/lib/permissions';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const backfillSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
});

const exportSchema = z.object({
  entitySource: z.enum(['subscribers', 'advertisers', 'messages', 'all']),
  filter: z.enum(['active', 'all']).default('all'),
});

export async function runGeoStatsNow() {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.GEO_VIEW);

  const results = await runGeoStatsJob();
  revalidatePath('/geo');

  return {
    ok: true as const,
    results,
  };
}

export async function backfillGeoStatsNow(days = 30) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.GEO_VIEW);
  const parsed = backfillSchema.parse({ days });

  const result = await backfillGeoStats(parsed.days);
  revalidatePath('/geo');

  return {
    ok: true as const,
    ...result,
  };
}

export async function exportGeoReport(input: {
  entitySource: GeoEntitySource;
  filter: GeoSubscriberFilter;
}) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.GEO_EXPORT);
  const parsed = exportSchema.parse(input);

  const [stats, growthMap] = await Promise.all([
    getGeoStats(parsed.entitySource as GeoEntitySource, parsed.filter as GeoSubscriberFilter),
    getCityGrowthMap(30),
  ]);

  return {
    ok: true as const,
    csv: buildGeoReportCsv({
      stats,
      growthMap,
      entitySource: parsed.entitySource as GeoEntitySource,
      filter: parsed.filter as GeoSubscriberFilter,
    }),
    filename: geoExportFilename(parsed.entitySource as GeoEntitySource),
  };
}
