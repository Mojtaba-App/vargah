import { resolveIranCityId } from '@vargah/business/iran-geo';

export function subscriberCityUpdate(province?: string | null, city?: string | null) {
  const cityId = resolveIranCityId(province, city);
  return {
    province: province?.trim() || null,
    city: city?.trim() || null,
    cityId,
  };
}
