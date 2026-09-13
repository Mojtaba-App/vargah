import { randomBytes } from 'node:crypto';
import path from 'node:path';

import { putPrivateUpload } from '@vargah/business/storage';
import {
  assertBufferMatchesMime,
  extensionForMime,
  normalizeMimeType,
} from '@vargah/security/file-magic';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const DOCUMENT_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

const PRIVATE_ROOT = path.resolve(process.cwd(), 'storage', 'private');

function sanitizeBaseName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[/\\]/g, '')
    .replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 80);
}

function sanitizeOriginalFileName(name: string): string {
  return name.replace(/[/\\]/g, '').replace(/\0/g, '').slice(0, 255);
}

function guessMimeFromExt(ext: string): string {
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.doc') return 'application/msword';
  if (ext === '.docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return '';
}

function resolveDocumentMime(file: File, buffer: Uint8Array): string {
  const declared = normalizeMimeType(file.type);
  const ext = path.extname(file.name).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('فقط فایل‌های PDF یا Word مجاز هستند.');
  }

  let resolved: string;
  try {
    resolved = assertBufferMatchesMime(buffer, declared || guessMimeFromExt(ext));
  } catch {
    throw new Error('محتوای فایل معتبر نیست. لطفاً PDF یا Word ارسال کنید.');
  }

  if (resolved === 'application/zip') {
    if (ext !== '.docx') {
      throw new Error('فقط فایل‌های PDF یا Word مجاز هستند.');
    }
    resolved = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  if (ext === '.pdf' && resolved !== 'application/pdf') {
    throw new Error('محتوای فایل با پسوند PDF مطابقت ندارد.');
  }
  if (ext === '.doc' && resolved !== 'application/msword') {
    throw new Error('محتوای فایل با پسوند DOC مطابقت ندارد.');
  }
  if (
    ext === '.docx' &&
    resolved !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    throw new Error('محتوای فایل با پسوند DOCX مطابقت ندارد.');
  }

  if (!DOCUMENT_MIMES.has(resolved)) {
    throw new Error('فقط فایل‌های PDF یا Word مجاز هستند.');
  }

  return resolved;
}

/** ذخیرهٔ خصوصی رزومه/مدارک — خارج از public/ (یا S3 private/) */
export async function saveCollaborationDocument(
  file: File,
  folder: 'resumes' | 'submissions',
): Promise<{ url: string; fileName: string; mimeType: string }> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error('لطفاً فایل را انتخاب کنید.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('حداکثر حجم فایل ۸ مگابایت است.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = resolveDocumentMime(file, new Uint8Array(buffer));
  const ext = extensionForMime(mimeType);
  if (!ext) {
    throw new Error('نوع فایل قابل ذخیره‌سازی نیست.');
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const storedName = `${Date.now()}-${randomBytes(4).toString('hex')}-${sanitizeBaseName(file.name)}${ext}`;
  const key = `${folder}/${year}/${month}/${storedName}`;

  const stored = await putPrivateUpload({
    key,
    body: buffer,
    contentType: mimeType,
    privateRoot: PRIVATE_ROOT,
  });

  return {
    url: stored.publicPath,
    fileName: sanitizeOriginalFileName(file.name),
    mimeType,
  };
}
