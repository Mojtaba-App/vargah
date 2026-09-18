import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@vargah/database';

import {
  CAPTCHA_ALPHABET,
  CAPTCHA_LENGTH,
  isCaptchaAnswerShape,
  normalizeCaptchaAnswer,
} from '@/lib/security/login-captcha-shared';

export const ADMIN_CAPTCHA_COOKIE = 'vargah_admin_captcha';

const TTL_MS = 3 * 60 * 1000;

type CaptchaPayload = {
  nonce: string;
  exp: number;
  mac: string;
};

function getSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

function mac(code: string, nonce: string, exp: number, secret: string): string {
  return createHmac('sha256', secret).update(`${code}:${nonce}:${exp}`).digest('base64url');
}

function sign(payload: CaptchaPayload, secret: string): string {
  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', secret).update(body).digest('base64url');
  return `${Buffer.from(body).toString('base64url')}.${signature}`;
}

function readPayload(token: string, secret: string): CaptchaPayload | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const bodyPart = token.slice(0, dot);
  const signaturePart = token.slice(dot + 1);

  let body: string;
  try {
    body = Buffer.from(bodyPart, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  const left = Buffer.from(signaturePart);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  let payload: CaptchaPayload;
  try {
    payload = JSON.parse(body) as CaptchaPayload;
  } catch {
    return null;
  }

  if (
    !payload.nonce ||
    !payload.mac ||
    typeof payload.exp !== 'number' ||
    payload.exp <= Date.now()
  ) {
    return null;
  }
  return payload;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderCaptchaSvg(code: string): string {
  const glyphs = [...code]
    .map((char, index) => {
      const x = 22 + index * 28;
      const y = 34 + (index % 2 === 0 ? -3 : 4);
      const rotate = index % 2 === 0 ? -14 : 12;
      return `<text x="${x}" y="${y}" transform="rotate(${rotate} ${x} ${y})" font-size="26" font-family="ui-monospace, monospace" font-weight="700" fill="#1c1917">${escapeXml(char)}</text>`;
    })
    .join('');

  const noise = Array.from({ length: 5 }, () => {
    const x1 = randomInt(8, 150);
    const y1 = randomInt(6, 46);
    const x2 = randomInt(8, 160);
    const y2 = randomInt(6, 50);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#a8a29e" stroke-width="1" />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="52" viewBox="0 0 168 52" role="img" aria-hidden="true"><rect width="168" height="52" rx="10" fill="#f5f5f4"/>${noise}${glyphs}</svg>`;
}

export function createCaptchaChallenge(): { svg: string; token: string; maxAge: number } | null {
  const secret = getSecret();
  if (!secret) return null;

  let code = '';
  for (let index = 0; index < CAPTCHA_LENGTH; index += 1) {
    code += CAPTCHA_ALPHABET[randomInt(CAPTCHA_ALPHABET.length)] ?? 'A';
  }

  const nonce = randomBytes(16).toString('base64url');
  const exp = Date.now() + TTL_MS;
  const token = sign({ nonce, exp, mac: mac(code, nonce, exp, secret) }, secret);
  return { svg: renderCaptchaSvg(code), token, maxAge: Math.floor(TTL_MS / 1000) };
}

export async function verifyAndConsumeCaptcha(answer: string | undefined): Promise<boolean> {
  const secret = getSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_CAPTCHA_COOKIE)?.value;
  cookieStore.set(ADMIN_CAPTCHA_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  if (!secret || !token || !answer || !isCaptchaAnswerShape(answer)) return false;

  const payload = readPayload(token, secret);
  if (!payload) return false;

  const expected = mac(normalizeCaptchaAnswer(answer), payload.nonce, payload.exp, secret);
  const left = Buffer.from(payload.mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;

  try {
    await prisma.rateLimitBucket.create({
      data: {
        key: `admin-captcha-used:${payload.nonce}`,
        count: 1,
        resetAt: new Date(payload.exp),
      },
    });
    return true;
  } catch {
    return false;
  }
}
