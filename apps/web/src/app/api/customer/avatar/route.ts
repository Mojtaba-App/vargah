import { unlink } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';
import { putPublicUpload } from '@vargah/business/storage';
import { prisma } from '@vargah/database';
import { assertBufferMatchesMime, normalizeMimeType } from '@vargah/security/file-magic';

import { getCustomerSession, setCustomerSessionCookie } from '@/lib/customer-auth/session';
import { verifyCsrfFromHttpRequest } from '@/lib/security/request';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const WEB_PUBLIC = path.resolve(process.cwd(), 'public');

async function getCustomerUser() {
  const session = await getCustomerSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { phone: session.phone },
    select: { id: true, name: true, avatar: true },
  });

  return user ? { session, user } : null;
}

export async function POST(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const auth = await getCustomerUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('avatar');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'حداکثر حجم تصویر ۲ مگابایت است' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let resolvedMime: string;
  try {
    resolvedMime = assertBufferMatchesMime(new Uint8Array(buffer), file.type);
  } catch {
    return NextResponse.json({ error: 'محتوای تصویر معتبر نیست' }, { status: 400 });
  }

  resolvedMime = normalizeMimeType(resolvedMime);
  if (!ALLOWED_TYPES.has(resolvedMime)) {
    return NextResponse.json({ error: 'فقط تصاویر JPG، PNG یا WebP مجاز است' }, { status: 400 });
  }

  const ext = resolvedMime === 'image/png' ? 'png' : resolvedMime === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${auth.user.id}.${ext}`;
  const stored = await putPublicUpload({
    key: `uploads/avatars/${fileName}`,
    body: buffer,
    contentType: resolvedMime,
    localPublicRoots: [WEB_PUBLIC],
  });

  const avatarPath = `${stored.publicPath.split('?')[0]}?v=${Date.now()}`;

  const updated = await prisma.user.update({
    where: { id: auth.user.id },
    data: { avatar: avatarPath },
    select: { avatar: true, name: true },
  });

  await setCustomerSessionCookie({
    ...auth.session,
    name: updated.name ?? auth.session.name,
    avatar: updated.avatar,
  });

  return NextResponse.json({ success: true, avatar: updated.avatar });
}

export async function DELETE(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const auth = await getCustomerUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (auth.user.avatar) {
    const filePath = path.join(
      process.cwd(),
      'public',
      auth.user.avatar.split('?')[0]!.replace(/^\//, ''),
    );
    await unlink(filePath).catch(() => undefined);
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { avatar: null },
  });

  await setCustomerSessionCookie({
    ...auth.session,
    avatar: null,
  });

  return NextResponse.json({ success: true });
}
