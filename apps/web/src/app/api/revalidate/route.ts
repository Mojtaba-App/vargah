import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

const ALLOWED_TAGS = new Set([
  'site-config',
  'payment-config',
  'subscription-plans',
  'services-content',
  'articles',
  'issues',
  'categories',
  'sitemap',
]);

function isAllowedPath(path: string): boolean {
  if (path === '/sitemap.xml') return true;
  if (path.startsWith('/articles/')) return true;
  if (path.startsWith('/issues')) return true;
  if (path.startsWith('/subscription')) return true;
  if (/^\/[a-z]{2}\/(issues|subscription|advertising|collaborate)/.test(path)) return true;
  if (path === '/') return true;
  return false;
}

function isAllowedTag(tag: string): boolean {
  if (ALLOWED_TAGS.has(tag)) return true;
  if (tag.startsWith('article:')) return true;
  if (tag.startsWith('issue:')) return true;
  return false;
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const auth = request.headers.get('authorization');

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { tags?: string[]; paths?: string[] };

  const tags = (body.tags ?? []).filter(isAllowedTag);
  const paths = (body.paths ?? []).filter(isAllowedPath);

  for (const tag of tags) {
    revalidateTag(tag, 'max');
  }
  for (const path of paths) {
    revalidatePath(path);
  }

  if (paths.includes('/sitemap.xml') || tags.some((t) => t === 'articles')) {
    revalidatePath('/sitemap.xml');
  }

  return NextResponse.json({ revalidated: true, tags, paths });
}
