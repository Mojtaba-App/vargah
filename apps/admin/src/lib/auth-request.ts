import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SESSION_COOKIE =
  process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token';

export async function getRequestUserId(req?: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  if (req) {
    const token = await getToken({ req, secret, cookieName: SESSION_COOKIE });
    return (token?.sub as string | undefined) ?? null;
  }

  const cookieStore = await cookies();
  const token = await getToken({
    req: {
      cookies: Object.fromEntries(
        cookieStore.getAll().map((cookie) => [cookie.name, cookie.value]),
      ),
    } as unknown as NextRequest,
    secret,
    cookieName: SESSION_COOKIE,
  });

  return (token?.sub as string | undefined) ?? null;
}
