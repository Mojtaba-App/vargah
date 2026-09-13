import path from 'node:path';

import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { SiteBrandingSettings } from '@vargah/business/site-settings';
import { putPublicUpload } from '@vargah/business/storage';

import { auth } from '@/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
import { getSiteConfig, saveSiteConfig } from '@/lib/site-config';
import { verifyCsrfFromHttpRequest } from '@/lib/security/request';
import { assertBufferMatchesMime, normalizeMimeType } from '@vargah/security/file-magic';

const MAX_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/x-icon']);

const WEB_PUBLIC = path.resolve(process.cwd(), '../web/public');
const ADMIN_PUBLIC = path.resolve(process.cwd(), 'public');

type BrandingField = keyof Pick<
  SiteBrandingSettings,
  'siteLogo' | 'favicon' | 'adminLogo' | 'loginLogo' | 'loginBackground' | 'heroBanner'
>;

const FILE_NAMES: Record<BrandingField, string> = {
  siteLogo: 'site-logo',
  favicon: 'favicon',
  adminLogo: 'admin-logo',
  loginLogo: 'login-logo',
  loginBackground: 'login-background',
  heroBanner: 'hero-banner',
};

export async function POST(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const session = await auth();
  if (!session?.user?.id || !(await hasPermissionAsync(session.user.role, PERMISSIONS.SETTINGS_EDIT))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const field = String(formData.get('field') ?? '') as BrandingField;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 400 });
  }

  if (!FILE_NAMES[field]) {
    return NextResponse.json({ error: 'فیلد نامعتبر' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'حداکثر حجم فایل ۳ مگابایت است' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let resolvedMime: string;
  try {
    resolvedMime = assertBufferMatchesMime(new Uint8Array(buffer), file.type);
  } catch {
    return NextResponse.json({ error: 'محتوای فایل تصویر معتبر نیست' }, { status: 400 });
  }

  resolvedMime = normalizeMimeType(resolvedMime);
  if (!ALLOWED_TYPES.has(resolvedMime)) {
    return NextResponse.json({ error: 'فرمت فایل مجاز نیست' }, { status: 400 });
  }

  const ext =
    resolvedMime === 'image/png'
      ? 'png'
      : resolvedMime === 'image/webp'
        ? 'webp'
        : resolvedMime === 'image/x-icon'
          ? 'ico'
          : 'jpg';

  const fileName = `${FILE_NAMES[field]}.${ext}`;
  const key = `uploads/branding/${fileName}`;

  const stored = await putPublicUpload({
    key,
    body: buffer,
    contentType: resolvedMime,
    localPublicRoots: [WEB_PUBLIC, ADMIN_PUBLIC],
  });

  const publicPath = `${stored.publicPath}?v=${Date.now()}`;

  const current = await getSiteConfig();
  const branding = { ...current.branding, [field]: publicPath };
  await saveSiteConfig({ ...current, branding });

  revalidatePath('/settings');
  revalidatePath('/login');
  revalidateTag('site-config', 'max');

  return NextResponse.json({ path: publicPath, field });
}
