import { randomBytes } from 'node:crypto';
import path from 'node:path';

import { NextResponse } from 'next/server';
import { putPublicUpload } from '@vargah/business/storage';
import { assertBufferMatchesMime, normalizeMimeType } from '@vargah/security/file-magic';

import { auth } from '@/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
import { verifyCsrfFromHttpRequest } from '@/lib/security/request';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const WEB_PUBLIC = path.resolve(process.cwd(), '../web/public');
const ADMIN_PUBLIC = path.resolve(process.cwd(), 'public');

export async function POST(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const session = await auth();
  if (
    !session?.user?.id ||
    !(await hasPermissionAsync(session.user.role, PERMISSIONS.SETTINGS_EDIT))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'حداکثر حجم آواتار ۲ مگابایت است' }, { status: 400 });
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
    return NextResponse.json({ error: 'فرمت مجاز: JPG، PNG یا WebP' }, { status: 400 });
  }

  const ext = resolvedMime === 'image/png' ? 'png' : resolvedMime === 'image/webp' ? 'webp' : 'jpg';
  const storedName = `team-${Date.now()}-${randomBytes(3).toString('hex')}.${ext}`;
  const key = `uploads/about/${storedName}`;

  const stored = await putPublicUpload({
    key,
    body: buffer,
    contentType: resolvedMime,
    localPublicRoots: [WEB_PUBLIC, ADMIN_PUBLIC],
  });

  return NextResponse.json({
    path: stored.publicPath,
  });
}
