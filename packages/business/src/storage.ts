import { createHash, createHmac, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type StoredObject = {
  /** مسیر عمومی مثل /uploads/... یا URL کامل CDN */
  publicPath: string;
  key: string;
  storage: 's3' | 'local';
};

function isS3Configured() {
  return Boolean(
    process.env.S3_ENDPOINT?.trim() &&
      process.env.S3_ACCESS_KEY?.trim() &&
      process.env.S3_SECRET_KEY?.trim() &&
      process.env.S3_BUCKET?.trim(),
  );
}

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION?.trim() || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT?.trim(),
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!.trim(),
      secretAccessKey: process.env.S3_SECRET_KEY!.trim(),
    },
  });
}

function toPublicUrl(key: string) {
  const normalized = key.replace(/^\/+/, '');
  const cdn = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, '');
  if (cdn) return `${cdn}/${normalized}`;
  return `/${normalized}`;
}

/**
 * آپلود عمومی (مدیا، برندینگ، …).
 * localPublicRoots: پوشه‌های `public` برای نوشتن محلی وقتی S3 نیست (یا mirror اختیاری).
 */
export async function putPublicUpload(params: {
  key: string;
  body: Buffer;
  contentType: string;
  localPublicRoots: string[];
  /** اگر true و S3 فعال است، روی دیسک محلی هم mirror می‌شود (پیش‌فرض false) */
  mirrorLocalWhenS3?: boolean;
}): Promise<StoredObject> {
  const key = params.key.replace(/^\/+/, '');

  const writeLocal = async () => {
    for (const root of params.localPublicRoots) {
      const full = path.join(root, key);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, params.body);
    }
  };

  if (isS3Configured()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: key,
        Body: params.body,
        ContentType: params.contentType,
        ACL: 'public-read',
      }),
    );
    if (params.mirrorLocalWhenS3) await writeLocal();
    return { publicPath: toPublicUrl(key), key, storage: 's3' };
  }

  await writeLocal();
  return { publicPath: toPublicUrl(key), key, storage: 'local' };
}

/** فایل خصوصی (رزومه/مدارک) — خارج از public یا کلید private/ در S3 */
export async function putPrivateUpload(params: {
  key: string;
  body: Buffer;
  contentType: string;
  privateRoot: string;
}): Promise<StoredObject> {
  const key = params.key.replace(/^\/+/, '');

  if (isS3Configured()) {
    const s3Key = key.startsWith('private/') ? key : `private/${key}`;
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: s3Key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );
    return { publicPath: `private://${key.replace(/^private\//, '')}`, key: s3Key, storage: 's3' };
  }

  const full = path.join(params.privateRoot, key.replace(/^private\//, ''));
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, params.body);
  return {
    publicPath: `private://${key.replace(/^private\//, '')}`,
    key,
    storage: 'local',
  };
}

export async function getPrivateSignedUrl(key: string, expiresIn = 600): Promise<string | null> {
  if (!isS3Configured()) return null;
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!.trim(),
    Key: key.startsWith('private/') ? key : `private/${key}`,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

export function signWebhookPayload(secret: string, body: string) {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export function isObjectStorageConfigured() {
  return isS3Configured();
}
