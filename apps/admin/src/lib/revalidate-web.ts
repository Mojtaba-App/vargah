const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, '');

export async function revalidateWeb(options: { tags?: string[]; paths?: string[] }) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !siteUrl) return;

  try {
    await fetch(`${siteUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
      cache: 'no-store',
    });
  } catch {
    // وب ممکن است در dev خاموش باشد
  }
}

export function cdnAssetUrl(path: string): string {
  if (!cdnUrl) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${cdnUrl}${normalized}`;
}
