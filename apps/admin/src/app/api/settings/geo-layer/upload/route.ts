import { randomBytes } from 'node:crypto';
import path from 'node:path';

import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { putPublicUpload } from '@vargah/business/storage';

import { auth } from '@/auth';
import { assertValidGeoJson, kmlToGeoJson } from '@/lib/geo/kml-to-geojson';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
import { verifyCsrfFromHttpRequest } from '@/lib/security/request';

const MAX_SIZE = 12 * 1024 * 1024;
const MAX_UNCOMPRESSED_ENTRY = 8 * 1024 * 1024;
const MAX_UNCOMPRESSED_TOTAL = 24 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 100;
const MAX_GEO_FEATURES = 50_000;
const WEB_PUBLIC = path.resolve(process.cwd(), '../web/public');
const ADMIN_PUBLIC = path.resolve(process.cwd(), 'public');

function sanitizeBaseName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._\u0600-\u06FF-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

async function extractKmlFromKmz(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  let uncompressedTotal = 0;
  for (const entry of entries) {
    const data = await entry.async('uint8array');
    uncompressedTotal += data.byteLength;
    if (data.byteLength > MAX_UNCOMPRESSED_ENTRY) {
      throw new Error('یکی از فایل‌های داخل KMZ بیش از حد بزرگ است');
    }
    if (uncompressedTotal > MAX_UNCOMPRESSED_TOTAL) {
      throw new Error('حجم بازشدهٔ KMZ بیش از حد مجاز است');
    }
  }

  if (buffer.length > 0 && uncompressedTotal / buffer.length > MAX_COMPRESSION_RATIO) {
    throw new Error('نسبت فشرده‌سازی KMZ مشکوک است (احتمال zip bomb)');
  }

  const preferred =
    entries.find((entry) => /(^|\/)doc\.kml$/i.test(entry.name)) ??
    entries.find((entry) => entry.name.toLowerCase().endsWith('.kml'));

  if (!preferred) {
    throw new Error('فایل KMZ فاقد KML است');
  }

  return preferred.async('text');
}

export async function POST(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const session = await auth();
  if (!session?.user?.id || !(await hasPermissionAsync(session.user.role, PERMISSIONS.SETTINGS_EDIT))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'حداکثر حجم فایل ۱۲ مگابایت است' }, { status: 400 });
  }

  const originalName = file.name || 'layer';
  const ext = path.extname(originalName).toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let geoJson;
  let sourceFormat: 'geojson' | 'kml' | 'kmz';

  try {
    if (ext === '.geojson' || ext === '.json' || file.type.includes('json')) {
      geoJson = assertValidGeoJson(JSON.parse(buffer.toString('utf8')));
      sourceFormat = 'geojson';
    } else if (ext === '.kml' || file.type.includes('kml')) {
      geoJson = kmlToGeoJson(buffer.toString('utf8'));
      sourceFormat = 'kml';
    } else if (ext === '.kmz' || file.type.includes('kmz') || file.type.includes('zip')) {
      const kml = await extractKmlFromKmz(buffer);
      geoJson = kmlToGeoJson(kml);
      sourceFormat = 'kmz';
    } else {
      return NextResponse.json(
        { error: 'فرمت مجاز: GeoJSON، KML یا KMZ' },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'تبدیل فایل ناموفق بود' },
      { status: 400 },
    );
  }

  if (!geoJson.features.length) {
    return NextResponse.json({ error: 'هیچ عارضه‌ای در فایل یافت نشد' }, { status: 400 });
  }

  if (geoJson.features.length > MAX_GEO_FEATURES) {
    return NextResponse.json(
      { error: `حداکثر ${MAX_GEO_FEATURES.toLocaleString('fa-IR')} عارضه مجاز است` },
      { status: 400 },
    );
  }

  const token = randomBytes(4).toString('hex');
  const storedName = `${Date.now()}-${token}-${sanitizeBaseName(originalName)}.geojson`;
  const payload = Buffer.from(`${JSON.stringify(geoJson)}\n`, 'utf8');
  const key = `uploads/geo-layers/${storedName}`;

  const stored = await putPublicUpload({
    key,
    body: payload,
    contentType: 'application/geo+json',
    localPublicRoots: [WEB_PUBLIC, ADMIN_PUBLIC],
  });

  return NextResponse.json({
    path: stored.publicPath,
    sourceFormat,
    originalName,
    featureCount: geoJson.features.length,
  });
}
