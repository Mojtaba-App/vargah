import { adminPath } from '@/lib/base-path';

export type ExportColumn = {
  key: string;
  header: string;
  width?: number;
};

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

export type ExportMeta = {
  title: string;
  subtitle?: string;
  filename: string;
  generatedAt?: Date;
};

export function stampFilename(base: string, ext: string): string {
  const safe = base.replace(/[^\w\u0600-\u06FF-]+/g, '-').replace(/-+/g, '-');
  const date = new Date().toISOString().slice(0, 10);
  return `${safe}-${date}.${ext}`;
}

export function cellText(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر';
  return String(value);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function fontUrl(
  file:
    | 'Vazirmatn-Regular.ttf'
    | 'Vazirmatn-Bold.ttf'
    | 'NotoNaskhArabic-Regular.ttf'
    | 'NotoNaskhArabic-Bold.ttf',
): string {
  return adminPath(`/fonts/${file}`);
}

export async function fetchFontAsBase64(
  file:
    | 'Vazirmatn-Regular.ttf'
    | 'Vazirmatn-Bold.ttf'
    | 'NotoNaskhArabic-Regular.ttf'
    | 'NotoNaskhArabic-Bold.ttf',
): Promise<string> {
  const res = await fetch(fontUrl(file));
  if (!res.ok) throw new Error('بارگذاری فونت فارسی ناموفق بود');
  const buffer = await res.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
