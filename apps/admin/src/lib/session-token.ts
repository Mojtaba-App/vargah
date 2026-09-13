import { encode } from '@auth/core/jwt';
import { cookies } from 'next/headers';
import type { UserRole } from '@vargah/database/enums';
import { ACCESS_TOKEN_MAX_AGE } from '@vargah/security/token-constants';

export type SessionUserPayload = {
  id: string;
  role: UserRole;
  email: string | null;
  name: string | null;
  avatar?: string | null;
  twoFactorEnabled?: boolean;
};

const SESSION_COOKIE =
  process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token';

export async function setSessionCookie(user: SessionUserPayload) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET missing');

  const sessionToken = await encode({
    token: {
      sub: user.id,
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      picture: user.avatar ?? undefined,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
    },
    secret,
    maxAge: ACCESS_TOKEN_MAX_AGE,
    salt: 'authjs.session-token',
  });

  const isProd = process.env.NODE_ENV === 'production';
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
}
