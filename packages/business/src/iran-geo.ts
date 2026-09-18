import {
  getIranCitiesByProvince,
  getIranProvinceNames,
  IRAN_PROVINCES,
  isValidIranProvinceCity,
} from './iran-locations';

export type IranCityRecord = {
  id: string;
  province: string;
  name: string;
  lat: number;
  lng: number;
};

/** مرکز تقریبی استان‌ها (WGS84) — منبع: OpenStreetMap / مراجع عمومی */
export const IRAN_PROVINCE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  اردبیل: { lat: 38.2498, lng: 48.2933 },
  اصفهان: { lat: 32.6546, lng: 51.668 },
  البرز: { lat: 35.84, lng: 50.9391 },
  ایلام: { lat: 33.6374, lng: 46.4227 },
  'آذربایجان شرقی': { lat: 38.0962, lng: 46.2738 },
  'آذربایجان غربی': { lat: 37.555, lng: 45.0725 },
  بوشهر: { lat: 28.9234, lng: 50.8203 },
  تهران: { lat: 35.6892, lng: 51.389 },
  'چهارمحال وبختیاری': { lat: 32.3256, lng: 50.8644 },
  'خراسان جنوبی': { lat: 32.8649, lng: 59.2262 },
  'خراسان رضوی': { lat: 36.297, lng: 59.6062 },
  'خراسان شمالی': { lat: 37.471, lng: 57.1013 },
  خوزستان: { lat: 31.3183, lng: 48.6706 },
  زنجان: { lat: 36.6764, lng: 48.4963 },
  سمنان: { lat: 35.5729, lng: 53.3971 },
  'سیستان وبلوچستان': { lat: 29.4963, lng: 60.8629 },
  فارس: { lat: 29.5918, lng: 52.5837 },
  قزوین: { lat: 36.2688, lng: 50.0041 },
  قم: { lat: 34.6416, lng: 50.8746 },
  کردستان: { lat: 35.3219, lng: 46.9862 },
  کرمان: { lat: 30.2839, lng: 57.0834 },
  کرمانشاه: { lat: 34.3142, lng: 47.065 },
  'کهگیلویه وبویراحمد': { lat: 30.6509, lng: 51.605 },
  گلستان: { lat: 36.8456, lng: 54.4393 },
  گیلان: { lat: 37.2808, lng: 49.5832 },
  لرستان: { lat: 33.4878, lng: 48.3558 },
  مازندران: { lat: 36.5659, lng: 53.0586 },
  مرکزی: { lat: 34.0917, lng: 49.6892 },
  هرمزگان: { lat: 27.1865, lng: 56.277 },
  همدان: { lat: 34.7992, lng: 48.5146 },
  یزد: { lat: 31.8974, lng: 54.3569 },
};

/** لایه‌های رایگان OpenStreetMap و مشتقات (بدون API Key) */
export const FREE_MAP_LAYERS = {
  osm: {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  },
  osmHot: {
    id: 'osm-hot',
    label: 'OSM Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap, HOT',
    maxZoom: 19,
  },
  carto: {
    id: 'carto',
    label: 'Carto Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 20,
  },
  topo: {
    id: 'topo',
    label: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap, SRTM | OpenTopoMap',
    maxZoom: 17,
  },
} as const;

export type FreeMapLayerId = keyof typeof FREE_MAP_LAYERS;

export function buildIranCityId(province: string, city: string): string {
  const provinceIndex = getIranProvinceNames().indexOf(province.trim());
  const cityIndex = getIranCitiesByProvince(province).indexOf(city.trim());
  if (provinceIndex < 0 || cityIndex < 0) {
    throw new Error(`Invalid Iran city: ${province} / ${city}`);
  }
  return `ir-${String(provinceIndex + 1).padStart(2, '0')}-${String(cityIndex + 1).padStart(4, '0')}`;
}

export function resolveIranCityId(province?: string | null, city?: string | null): string | null {
  if (!province?.trim() || !city?.trim()) return null;
  if (!isValidIranProvinceCity(province, city)) return null;
  try {
    return buildIranCityId(province, city);
  } catch {
    return null;
  }
}

function spreadCityCoordinates(
  baseLat: number,
  baseLng: number,
  index: number,
  total: number,
): { lat: number; lng: number } {
  if (total <= 1) return { lat: baseLat, lng: baseLng };
  const angle = (index / total) * Math.PI * 2;
  const ring = Math.floor(index / 8) + 1;
  const radius = 0.08 * ring;
  return {
    lat: Number((baseLat + Math.cos(angle) * radius * 0.55).toFixed(5)),
    lng: Number((baseLng + Math.sin(angle) * radius).toFixed(5)),
  };
}

export function buildIranCityCatalog(): IranCityRecord[] {
  const catalog: IranCityRecord[] = [];

  for (const entry of IRAN_PROVINCES) {
    const centroid = IRAN_PROVINCE_CENTROIDS[entry.province];
    if (!centroid) continue;

    entry.cities.forEach((city, index) => {
      const { lat, lng } = spreadCityCoordinates(
        centroid.lat,
        centroid.lng,
        index,
        entry.cities.length,
      );
      catalog.push({
        id: buildIranCityId(entry.province, city),
        province: entry.province,
        name: city,
        lat,
        lng,
      });
    });
  }

  return catalog;
}

export const IRAN_MAP_BOUNDS: [[number, number], [number, number]] = [
  [25.0, 44.0],
  [40.0, 63.5],
];

export const IRAN_MAP_CENTER: [number, number] = [32.5, 53.5];

/** نام استان در GeoJSON OSM گاهی فاصله متفاوت دارد */
export const IRAN_PROVINCE_GEOJSON_ALIASES: Record<string, string> = {
  'چهارمحال وبختیاری': 'چهارمحال و بختیاری',
  'سیستان وبلوچستان': 'سیستان و بلوچستان',
  'کهگیلویه وبویراحمد': 'کهگیلویه و بویراحمد',
};

export function provinceNameForGeoJson(province: string): string {
  return IRAN_PROVINCE_GEOJSON_ALIASES[province] ?? province;
}

export function provinceNameFromGeoJson(geoName: string): string {
  for (const [appName, jsonName] of Object.entries(IRAN_PROVINCE_GEOJSON_ALIASES)) {
    if (jsonName === geoName) return appName;
  }
  return geoName;
}
