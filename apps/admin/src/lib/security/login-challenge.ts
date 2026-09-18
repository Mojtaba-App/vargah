import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { ADMIN_LOGIN_CHALLENGE_MS } from '@vargah/security/admin-login';

export const ADMIN_LOGIN_CHALLENGE_COOKIE = 'vargah_admin_login_challenge';

type LoginChallengePayload = {
  userId: string;
  phone: string;
  exp: number;
  /** پس از تأیید SMS — برای مرحله TOTP */
  smsVerified?: boolean;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET missing');
  return secret;
}

function signPayload(payload: LoginChallengePayload): string {
  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${Buffer.from(body).toString('base64url')}.${signature}`;
}

function verifyToken(token: string): LoginChallengePayload | null {
  const [bodyPart, signaturePart] = token.split('.');
  if (!bodyPart || !signaturePart) return null;

  let payload: LoginChallengePayload;
  try {
    payload = JSON.parse(
      Buffer.from(bodyPart, 'base64url').toString('utf8'),
    ) as LoginChallengePayload;
  } catch {
    return null;
  }

  const expected = createHmac('sha256', getSecret())
    .update(JSON.stringify(payload))
    .digest('base64url');

  const sigBuf = Buffer.from(signaturePart);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  if (!payload.userId || !payload.phone || payload.exp <= Date.now()) {
    return null;
  }

  return payload;
}

export async function setLoginChallengeCookie(
  userId: string,
  phone: string,
  options?: { smsVerified?: boolean },
): Promise<void> {
  const payload: LoginChallengePayload = {
    userId,
    phone,
    exp: Date.now() + ADMIN_LOGIN_CHALLENGE_MS,
    ...(options?.smsVerified ? { smsVerified: true } : {}),
  };

  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';

  cookieStore.set(ADMIN_LOGIN_CHALLENGE_COOKIE, signPayload(payload), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(ADMIN_LOGIN_CHALLENGE_MS / 1000),
  });
}

export async function readLoginChallengeCookie(): Promise<LoginChallengePayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_LOGIN_CHALLENGE_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function clearLoginChallengeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_LOGIN_CHALLENGE_COOKIE);
}
