'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getIranCitiesByProvince, getIranProvinceNames } from '@vargah/business/iran-locations';
import { Label, Select } from '@vargah/ui/components/input';
import { buildGeoMapLink } from '@/lib/geo/links';
import type { GeoEntitySource, GeoSubscriberFilter } from '@/lib/geo/stats';

type GeoLocationFilterBarProps = {
  province: string;
  city: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  source?: GeoEntitySource;
  filter?: GeoSubscriberFilter;
};

export function GeoLocationFilterBar({
  province,
  city,
  onProvinceChange,
  onCityChange,
  source = 'subscribers',
  filter = 'active',
}: GeoLocationFilterBarProps) {
  const provinces = useMemo(() => getIranProvinceNames(), []);
  const cities = useMemo(() => getIranCitiesByProvince(province), [province]);

  const mapHref = buildGeoMapLink({
    province: province || undefined,
    city: city || undefined,
    source,
    filter,
    tab: 'map',
  });

  return (
    <div className="border-border/70 flex flex-col gap-3 rounded-2xl border p-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="crm-geo-province">استان</Label>
          <Select
            id="crm-geo-province"
            className="mt-2 rounded-xl"
            value={province}
            onChange={(event) => {
              onProvinceChange(event.target.value);
              onCityChange('');
            }}
          >
            <option value="">همه استان‌ها</option>
            {provinces.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="crm-geo-city">شهر</Label>
          <Select
            id="crm-geo-city"
            className="mt-2 rounded-xl"
            value={city}
            disabled={!province}
            onChange={(event) => onCityChange(event.target.value)}
          >
            <option value="">{province ? 'همه شهرها' : 'ابتدا استان را انتخاب کنید'}</option>
            {cities.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {(province || city) && (
        <Link
          href={mapHref}
          className="border-border bg-background/80 hover:bg-muted inline-flex h-9 items-center justify-center rounded-full border px-4 text-xs font-semibold shadow-sm transition-colors"
        >
          نمایش روی نقشه
        </Link>
      )}
    </div>
  );
}

function matchesGeoFilter(
  row: { province: string | null; city: string | null },
  province: string,
  city: string,
): boolean {
  if (province && row.province !== province) return false;
  if (city && row.city !== city) return false;
  return true;
}

export { matchesGeoFilter };
