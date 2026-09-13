import { randomBytes } from 'node:crypto';
import path from 'node:path';

import { NextResponse } from 'next/server';
import { prisma } from '@vargah/database';
import { putPublicUpload } from '@vargah/business/storage';
import {
  assertBufferMatchesMime,
  extensionForMime,
  normalizeMimeType,
} from '@vargah/security/file-magic';

import { auth } from '@/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
import { MEDIA_UPLOAD, isAllowedMediaMime } from '@/lib/media/constants';
import { verifyCsrfFromHttpRequest } from '@/lib/security/request';

const WEB_PUBLIC = path.resolve(process.cwd(), '../web/public');

function sanitizeBaseName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function buildStoredName(originalName: string, mimeType: string): string {
  const extFromName = path.extname(originalName).toLowerCase();
  const knownExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.txt', '.doc', '.docx']);
  const fromMime = extensionForMime(mimeType);
  const ext =
    (knownExt.has(extFromName) ? (extFromName === '.jpeg' ? '.jpg' : extFromName) : '') ||
    fromMime ||
    '.bin';

  const token = randomBytes(4).toString('hex');
  return `${Date.now()}-${token}-${sanitizeBaseName(originalName)}${ext}`;
}

export async function POST(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const session = await auth();
  if (!session?.user?.id || !(await hasPermissionAsync(session.user.role, PERMISSIONS.MEDIA_MANAGE))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const alt = String(formData.get('alt') ?? '').trim();
  const tagsRaw = String(formData.get('tags') ?? '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 400 });
  }

  if (file.size > MEDIA_UPLOAD.maxSize) {
    return NextResponse.json({ error: 'حداکثر حجم فایل: ۲۵ مگابایت' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const declared = normalizeMimeType(file.type);

  let resolvedMime: string;
  try {
    if (declared.startsWith('image/') || !declared) {
      resolvedMime = assertBufferMatchesMime(new Uint8Array(buffer), declared);
    } else if (
      declared === 'application/pdf' ||
      declared === 'application/msword' ||
      declared === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      resolvedMime = assertBufferMatchesMime(new Uint8Array(buffer), declared);
      if (
        resolvedMime === 'application/zip' &&
        declared === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        resolvedMime = declared;
      }
    } else {
      return NextResponse.json({ error: 'فرمت فایل مجاز نیست' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'محتوای فایل معتبر نیست' }, { status: 400 });
  }

  if (!isAllowedMediaMime(resolvedMime)) {
    return NextResponse.json({ error: 'فرمت فایل مجاز نیست' }, { status: 400 });
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const storedName = buildStoredName(file.name, resolvedMime);
  const key = `uploads/media/${year}/${month}/${storedName}`;

  const stored = await putPublicUpload({
    key,
    body: buffer,
    contentType: resolvedMime,
    localPublicRoots: [WEB_PUBLIC],
  });

  const publicPath = stored.publicPath;
  const tags = tagsRaw
    ? tagsRaw
        .split(/[,،]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: storedName,
      originalName: file.name,
      mimeType: resolvedMime,
      size: file.size,
      url: publicPath,
      alt: alt || null,
      tags,
      uploadedBy: session.user.id,
    },
  });

  return NextResponse.json({
    id: asset.id,
    url: publicPath,
    originalName: file.name,
    mimeType: resolvedMime,
    size: file.size,
    alt: asset.alt,
    tags: asset.tags,
    createdAt: asset.createdAt.toISOString(),
  });
}
