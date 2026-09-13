import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { UserRole } from '@vargah/database';

import { adminApiPath } from '@/lib/base-path';
import { REFRESH_COOKIE, rotateRefreshToken } from '@/lib/security/refresh-token';
import { setSessionCookie } from '@/lib/session-token';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!rawToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const rotated = await rotateRefreshToken(rawToken);
  if (!rotated) {
    cookieStore.delete(REFRESH_COOKIE);
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'AUTH_SECRET missing' }, { status: 500 });
  }

  await setSessionCookie({
    id: rotated.userId,
    role: rotated.role as UserRole,
    email: rotated.email,
    name: rotated.name,
    avatar: rotated.avatar,
    twoFactorEnabled: rotated.twoFactorEnabled,
  });

  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ ok: true });

  response.cookies.set(REFRESH_COOKIE, rotated.newRawToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: adminApiPath('/api/auth/refresh'),
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
