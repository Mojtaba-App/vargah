/**
 * Minimal KML → GeoJSON converter for Placemark Point / LineString / Polygon / MultiGeometry.
 * Enough for typical Google Earth / KMZ exports used as map overlays.
 */

type GeoJsonGeometry =
  | { type: 'Point'; coordinates: number[] }
  | { type: 'LineString'; coordinates: number[][] }
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPoint'; coordinates: number[][] }
  | { type: 'MultiLineString'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }
  | { type: 'GeometryCollection'; geometries: GeoJsonGeometry[] };

type GeoJsonFeature = {
  type: 'Feature';
  properties: Record<string, string>;
  geometry: GeoJsonGeometry | null;
};

export type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};

function parseCoordinates(text: string): number[][] {
  return text
    .trim()
    .split(/\s+/)
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [lon, lat, alt] = pair.split(',').map((part) => Number(part.trim()));
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      return Number.isFinite(alt) ? [lon, lat, alt] : [lon, lat];
    })
    .filter((coords): coords is number[] => Boolean(coords));
}

function tagContent(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match?.[1]?.trim() ?? null;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function geometryFromFragment(fragment: string): GeoJsonGeometry | null {
  const point = tagContent(fragment, 'Point');
  if (point) {
    const coords = parseCoordinates(tagContent(point, 'coordinates') ?? '');
    if (coords[0]) return { type: 'Point', coordinates: coords[0] };
  }

  const line = tagContent(fragment, 'LineString');
  if (line) {
    const coords = parseCoordinates(tagContent(line, 'coordinates') ?? '');
    if (coords.length) return { type: 'LineString', coordinates: coords };
  }

  const polygon = tagContent(fragment, 'Polygon');
  if (polygon) {
    const outer = tagContent(polygon, 'outerBoundaryIs') ?? polygon;
    const ring = parseCoordinates(tagContent(outer, 'coordinates') ?? '');
    if (ring.length) {
      const rings = [ring];
      const innerMatches = polygon.matchAll(/<innerBoundaryIs[\s\S]*?<\/innerBoundaryIs>/gi);
      for (const inner of innerMatches) {
        const innerRing = parseCoordinates(tagContent(inner[0], 'coordinates') ?? '');
        if (innerRing.length) rings.push(innerRing);
      }
      return { type: 'Polygon', coordinates: rings };
    }
  }

  const multi = tagContent(fragment, 'MultiGeometry');
  if (multi) {
    const geometries: GeoJsonGeometry[] = [];
    const childPatterns = [
      /<Point[\s\S]*?<\/Point>/gi,
      /<LineString[\s\S]*?<\/LineString>/gi,
      /<Polygon[\s\S]*?<\/Polygon>/gi,
    ];
    for (const pattern of childPatterns) {
      for (const match of multi.matchAll(pattern)) {
        const geometry = geometryFromFragment(match[0]);
        if (geometry) geometries.push(geometry);
      }
    }
    if (geometries.length === 1) return geometries[0]!;
    if (geometries.length > 1) return { type: 'GeometryCollection', geometries };
  }

  return null;
}

export function kmlToGeoJson(kml: string): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = [];
  const placemarks = kml.matchAll(/<Placemark[\s\S]*?<\/Placemark>/gi);

  for (const match of placemarks) {
    const fragment = match[0];
    const name = stripTags(tagContent(fragment, 'name') ?? '');
    const description = stripTags(tagContent(fragment, 'description') ?? '');
    const geometry = geometryFromFragment(fragment);
    features.push({
      type: 'Feature',
      properties: {
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
      },
      geometry,
    });
  }

  if (features.length === 0) {
    const geometry = geometryFromFragment(kml);
    if (geometry) {
      features.push({ type: 'Feature', properties: {}, geometry });
    }
  }

  return { type: 'FeatureCollection', features };
}

export function assertValidGeoJson(value: unknown): GeoJsonFeatureCollection {
  if (!value || typeof value !== 'object') {
    throw new Error('فایل GeoJSON نامعتبر است');
  }
  const doc = value as Record<string, unknown>;
  if (doc.type === 'FeatureCollection' && Array.isArray(doc.features)) {
    return value as GeoJsonFeatureCollection;
  }
  if (doc.type === 'Feature') {
    return { type: 'FeatureCollection', features: [value as GeoJsonFeature] };
  }
  if (typeof doc.type === 'string' && 'coordinates' in doc) {
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: value as GeoJsonGeometry }],
    };
  }
  throw new Error('ساختار GeoJSON پشتیبانی نمی‌شود');
}
