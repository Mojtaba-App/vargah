import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PREFIX = 'enc:v1:';

function deriveKey(): Buffer | null {
  const raw = process.env.SECRETS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return scryptSync(raw, 'vargah-secrets-v1', 32);
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}

/** AES-256-GCM — در production بدون کلید خطا می‌دهد */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return '';
  if (isEncryptedSecret(plaintext)) return plaintext;

  const key = deriveKey();
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SECRETS_ENCRYPTION_KEY در production الزامی است');
    }
    return plaintext;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptSecret(value: string): string {
  if (!value) return '';
  if (!isEncryptedSecret(value)) return value;

  const key = deriveKey();
  if (!key) {
    throw new Error('SECRETS_ENCRYPTION_KEY برای خواندن اسرار رمزنگاری‌شده الزامی است');
  }

  const payload = value.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('قالب اسرار رمزنگاری‌شده نامعتبر است');
  }

  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const data = Buffer.from(dataB64, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function encryptSecretField(value: string | null | undefined): string | null {
  if (value == null || value === '') return value ?? null;
  return encryptSecret(value);
}

export function decryptSecretField(value: string | null | undefined): string | null {
  if (value == null || value === '') return value ?? null;
  return decryptSecret(value);
}

export function constantTimeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
