import type { GeoEntitySource, GeoSubscriberFilter } from '@/lib/geo/stats';

export function buildGeoMapLink(params: {
  province?: string;
  city?: string;
  source?: GeoEntitySource;
  filter?: GeoSubscriberFilter;
  tab?: 'map' | 'reports';
}): string {
  const query = new URLSearchParams();
  if (params.province) query.set('province', params.province);
  if (params.city) query.set('city', params.city);
  if (params.source) query.set('source', params.source);
  if (params.filter) query.set('filter', params.filter);
  if (params.tab) query.set('tab', params.tab);
  const qs = query.toString();
  return qs ? `/geo?${qs}` : '/geo';
}
