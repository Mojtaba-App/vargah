import path from 'node:path';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { putPublicUpload } from '@vargah/business/storage';
import { prisma, AuditAction } from '@vargah/database';

import { recordAuditLog } from '@/lib/audit/record';
import { getRequestUserId } from '@/lib/auth-request';
import { setSessionCookie } from '@/lib/session-token';
import { verifyCsrfFromHttpRequest } from '@/lib/security/request';
import { assertBufferMatchesMime, normalizeMimeType } from '@vargah/security/file-magic';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ADMIN_PUBLIC = path.resolve(process.cwd(), 'public');

export async function POST(request: NextRequest) {
  verifyCsrfFromHttpRequest(request);
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('avatar');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let resolvedMime: string;
  try {
    resolvedMime = assertBufferMatchesMime(new Uint8Array(buffer), file.type);
  } catch {
    return NextResponse.json({ error: 'محتوای تصویر معتبر نیست' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(normalizeMimeType(resolvedMime))) {
    return NextResponse.json({ error: 'فقط تصاویر JPG، PNG یا WebP مجاز است' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'حداکثر حجم تصویر ۲ مگابایت است' }, { status: 400 });
  }

  const ext = resolvedMime === 'image/png' ? 'png' : resolvedMime === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${userId}.${ext}`;
  const stored = await putPublicUpload({
    key: `uploads/avatars/${fileName}`,
    body: buffer,
    contentType: resolvedMime,
    localPublicRoots: [ADMIN_PUBLIC],
  });

  const avatarPath = `${stored.publicPath.split('?')[0]}?v=${Date.now()}`;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarPath },
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });

  await recordAuditLog({
    userId: user.id,
    action: AuditAction.UPDATE,
    entity: 'User',
    entityId: user.id,
    changes: { field: 'avatar' },
  });

  await setSessionCookie(user);

  return NextResponse.json({ success: true, avatar: user.avatar });
}
