import iranProvincesCities from './data/iran-provinces-cities.json';

export type IranProvinceEntry = {
  province: string;
  cities: string[];
};

export const IRAN_PROVINCES: IranProvinceEntry[] = iranProvincesCities;

const provinceCityMap = new Map(
  IRAN_PROVINCES.map((entry) => [entry.province, new Set(entry.cities)]),
);

export function getIranProvinceNames(): string[] {
  return IRAN_PROVINCES.map((entry) => entry.province);
}

export function getIranCitiesByProvince(province: string): string[] {
  return IRAN_PROVINCES.find((entry) => entry.province === province)?.cities ?? [];
}

export function isValidIranProvince(province: string): boolean {
  return provinceCityMap.has(province);
}

export function isValidIranProvinceCity(province: string, city: string): boolean {
  if (!province || !city) return false;
  return provinceCityMap.get(province)?.has(city) ?? false;
}

export function formatIranLocation(province?: string | null, city?: string | null): string | null {
  const parts = [province?.trim(), city?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join('، ') : null;
}
