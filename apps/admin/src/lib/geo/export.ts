import type { GeoEntitySource, GeoSubscriberFilter, GeoSummary } from '@/lib/geo/stats';

export type GeoExportGrowthMap = Map<string, number>;

function escapeCsv(value: string | number): string {
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRow(cells: Array<string | number>): string {
  return cells.map(escapeCsv).join(',');
}

const SOURCE_LABELS: Record<GeoEntitySource, string> = {
  subscribers: 'مشترکین',
  advertisers: 'آگهی‌دهندگان',
  messages: 'پیام‌ها',
  all: 'همه منابع',
};

export function buildGeoReportCsv(input: {
  stats: GeoSummary;
  growthMap: GeoExportGrowthMap;
  entitySource: GeoEntitySource;
  filter: GeoSubscriberFilter;
  exportedAt?: Date;
}): string {
  const { stats, growthMap, entitySource, filter } = input;
  const exportedAt = input.exportedAt ?? new Date();
  const lines: string[] = [];

  lines.push('# گزارش جغرافیایی');
  lines.push(csvRow(['منبع', SOURCE_LABELS[entitySource]]));
  if (entitySource === 'subscribers' || entitySource === 'all') {
    lines.push(csvRow(['فیلتر مشترک', filter === 'active' ? 'فعال' : 'همه']));
  }
  lines.push(csvRow(['تاریخ خروجی', exportedAt.toLocaleString('fa-IR')]));
  lines.push(csvRow(['با موقعیت', stats.totalWithCity]));
  lines.push(csvRow(['بدون موقعیت', stats.totalWithoutCity]));
  lines.push('');

  lines.push('# توزیع استانی');
  lines.push(csvRow(['استان', 'تعداد']));
  for (const row of stats.provinceStats) {
    lines.push(csvRow([row.province, row.count]));
  }
  lines.push('');

  lines.push('# شهرها (با رشد ۳۰ روزه مشترک جدید)');
  lines.push(csvRow(['استان', 'شهر', 'تعداد', 'رشد ۳۰ روزه', 'عرض', 'طول']));
  for (const city of stats.cities) {
    lines.push(
      csvRow([
        city.province,
        city.city,
        city.count,
        growthMap.get(city.cityId) ?? 0,
        city.lat,
        city.lng,
      ]),
    );
  }

  return lines.join('\r\n');
}

export function geoExportFilename(entitySource: GeoEntitySource): string {
  const date = new Date().toISOString().slice(0, 10);
  return `geo-report-${entitySource}-${date}.csv`;
}
