import path from 'node:path';

import { NextResponse } from 'next/server';
import { putPublicUpload } from '@vargah/business/storage';

import { auth } from '@/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
import { verifyCsrfFromHttpRequest } from '@/lib/security/request';
import { assertBufferMatchesMime, normalizeMimeType } from '@vargah/security/file-magic';

const MAX_COVER_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 50 * 1024 * 1024;

const COVER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PDF_TYPES = new Set(['application/pdf']);

const WEB_PUBLIC = path.resolve(process.cwd(), '../web/public');

export async function POST(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const session = await auth();
  if (
    !session?.user?.id ||
    (!(await hasPermissionAsync(session.user.role, PERMISSIONS.ISSUE_EDIT)) &&
      !(await hasPermissionAsync(session.user.role, PERMISSIONS.ISSUE_CREATE)))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const type = String(formData.get('type') ?? '');
  const issueNumber = parseInt(String(formData.get('issueNumber') ?? ''), 10);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 400 });
  }

  if (!Number.isFinite(issueNumber) || issueNumber < 1) {
    return NextResponse.json({ error: 'شماره شماره نامعتبر است' }, { status: 400 });
  }

  if (type !== 'pdf' && type !== 'cover') {
    return NextResponse.json({ error: 'نوع فایل نامعتبر است' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let resolvedMime: string;
  try {
    resolvedMime = assertBufferMatchesMime(new Uint8Array(buffer), file.type);
  } catch {
    return NextResponse.json({ error: 'محتوای فایل با نوع اعلام‌شده مطابقت ندارد' }, { status: 400 });
  }
  resolvedMime = normalizeMimeType(resolvedMime);

  if (type === 'pdf') {
    if (!PDF_TYPES.has(resolvedMime)) {
      return NextResponse.json({ error: 'فقط فایل PDF مجاز است' }, { status: 400 });
    }
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: 'حداکثر حجم PDF: ۵۰ مگابایت' }, { status: 400 });
    }
  } else {
    if (!COVER_TYPES.has(resolvedMime)) {
      return NextResponse.json({ error: 'فرمت کاور مجاز نیست (JPG, PNG, WebP)' }, { status: 400 });
    }
    if (file.size > MAX_COVER_SIZE) {
      return NextResponse.json({ error: 'حداکثر حجم کاور: ۵ مگابایت' }, { status: 400 });
    }
  }

  const ext =
    type === 'pdf'
      ? 'pdf'
      : resolvedMime === 'image/png'
        ? 'png'
        : resolvedMime === 'image/webp'
          ? 'webp'
          : 'jpg';

  const fileName = type === 'pdf' ? `issue-${issueNumber}.pdf` : `cover-${issueNumber}.${ext}`;
  const key = `uploads/issues/${issueNumber}/${fileName}`;

  const stored = await putPublicUpload({
    key,
    body: buffer,
    contentType: resolvedMime,
    localPublicRoots: [WEB_PUBLIC],
  });

  const publicPath = `${stored.publicPath}?v=${Date.now()}`;

  return NextResponse.json({
    path: publicPath,
    field: type === 'pdf' ? 'pdfUrl' : 'coverImage',
  });
}
