/** آدرس پایه سایت — از env یا fallback محلی */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return url.replace(/\/$/, '');
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export function articleUrl(slug: string): string {
  return absoluteUrl(`/articles/${encodeURIComponent(slug)}`);
}

export function issueUrl(slug: string): string {
  return absoluteUrl(`/issues/${encodeURIComponent(slug)}`);
}
