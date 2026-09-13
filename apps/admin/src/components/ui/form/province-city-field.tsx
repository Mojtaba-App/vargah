'use client';

import { useMemo } from 'react';
import { getIranCitiesByProvince, getIranProvinceNames } from '@vargah/business/iran-locations';
import { Label, Select } from '@vargah/ui/components/input';
import { FieldMessage } from '@/components/ui/form/field-message';

type ProvinceCityFieldProps = {
  province: string;
  city: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
  provinceError?: string;
  cityError?: string;
};

export function ProvinceCityField({
  province,
  city,
  onProvinceChange,
  onCityChange,
  disabled,
  provinceError,
  cityError,
}: ProvinceCityFieldProps) {
  const provinces = useMemo(() => getIranProvinceNames(), []);
  const cities = useMemo(() => getIranCitiesByProvince(province), [province]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>استان</Label>
        <Select
          className="mt-2 rounded-xl"
          value={province}
          disabled={disabled}
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
        <FieldMessage message={provinceError} />
      </div>
      <div>
        <Label>شهر</Label>
        <Select
          className="mt-2 rounded-xl"
          value={city}
          disabled={disabled || !province}
          onChange={(event) => onCityChange(event.target.value)}
        >
          <option value="">{province ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید'}</option>
          {cities.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <FieldMessage message={cityError} />
      </div>
    </div>
  );
}
