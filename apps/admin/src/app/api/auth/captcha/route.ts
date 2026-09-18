import { NextResponse } from 'next/server';

import { getClientIp } from '@/lib/security/request';
import { rateLimitStore } from '@/lib/security/rate-limit';
import { ADMIN_CAPTCHA_COOKIE, createCaptchaChallenge } from '@/lib/security/login-captcha';

export async function GET() {
  const ip = await getClientIp();
  const limited = await rateLimitStore.check(`admin-captcha-issue:${ip}`, 30, 10 * 60 * 1000);
  if (!limited.allowed) {
    return new NextResponse(null, { status: 429 });
  }

  const challenge = createCaptchaChallenge();
  if (!challenge) {
    return new NextResponse(null, { status: 503 });
  }

  const response = new NextResponse(challenge.svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'X-Content-Type-Options': 'nosniff',
    },
  });

  response.cookies.set(ADMIN_CAPTCHA_COOKIE, challenge.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: challenge.maxAge,
  });

  return response;
}
