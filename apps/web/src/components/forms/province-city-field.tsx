'use client';

import { useMemo } from 'react';
import { getIranCitiesByProvince, getIranProvinceNames } from '@vargah/business/iran-locations';
import { Label, Select } from '@vargah/ui/components/input';
import { cn } from '@/lib/utils';

type ProvinceCityFieldProps = {
  province: string;
  city: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
  optional?: boolean;
  provinceId?: string;
  cityId?: string;
  className?: string;
};

export function ProvinceCityField({
  province,
  city,
  onProvinceChange,
  onCityChange,
  disabled,
  optional = false,
  provinceId = 'province',
  cityId = 'city',
  className,
}: ProvinceCityFieldProps) {
  const provinces = useMemo(() => getIranProvinceNames(), []);
  const cities = useMemo(() => getIranCitiesByProvince(province), [province]);

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <div className="space-y-2">
        <Label htmlFor={provinceId} required={!optional}>
          استان
        </Label>
        <Select
          id={provinceId}
          name={provinceId}
          className="rounded-xl"
          value={province}
          disabled={disabled}
          required={!optional}
          onChange={(event) => {
            onProvinceChange(event.target.value);
            onCityChange('');
          }}
        >
          <option value="">انتخاب استان</option>
          {provinces.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={cityId} required={!optional}>
          شهر
        </Label>
        <Select
          id={cityId}
          name={cityId}
          className="rounded-xl"
          value={city}
          disabled={disabled || !province}
          required={!optional}
          onChange={(event) => onCityChange(event.target.value)}
        >
          <option value="">{province ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید'}</option>
          {cities.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
