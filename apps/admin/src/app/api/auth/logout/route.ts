import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuditAction } from '@vargah/database';
import { getToken } from 'next-auth/jwt';

import { recordAuditLog } from '@/lib/audit/record';
import { adminApiPath } from '@/lib/base-path';
import { getClientIp, getUserAgent, verifyCsrfFromHttpRequest } from '@/lib/security/request';
import { REFRESH_COOKIE } from '@/lib/security/refresh-token';

const SESSION_COOKIE =
  process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token';

async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, '', {
    path: '/',
    maxAge: 0,
  });
  cookieStore.set(REFRESH_COOKIE, '', {
    path: adminApiPath('/api/auth/refresh'),
    maxAge: 0,
  });
}

async function getLogoutUserId() {
  const cookieStore = await cookies();
  const token = await getToken({
    req: { cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])) } as never,
    secret: process.env.AUTH_SECRET,
    cookieName: SESSION_COOKIE,
  });
  return typeof token?.sub === 'string' ? token.sub : null;
}

export async function POST(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const userId = await getLogoutUserId();
  if (userId) {
    const [ipAddress, userAgent] = await Promise.all([getClientIp(), getUserAgent()]);
    await recordAuditLog({
      userId,
      action: AuditAction.LOGOUT,
      entity: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}

/** خروج فقط با POST — GET حذف شد (CSRF logout) */
