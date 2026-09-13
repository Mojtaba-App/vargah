import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@vargah/database';
import { generateCsrfToken, CSRF_COOKIE } from '@vargah/security/csrf';
import { buildContentSecurityPolicy, createCspNonce } from '@vargah/security/headers';
import { requiresMandatory2FA } from '@vargah/security/roles';

import { adminPublicUrl } from '@/lib/base-path';

const SESSION_COOKIE =
  process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token';

export async function proxy(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const nonce = createCspNonce();
  const csp = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  if (isProd && req.headers.get('x-forwarded-proto') === 'http') {
    const host = req.headers.get('host') ?? req.nextUrl.host;
    const path = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    const redirect = NextResponse.redirect(`https://${host}${path}`, 301);
    redirect.headers.set('Content-Security-Policy', csp);
    return redirect;
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName: SESSION_COOKIE,
  });

  const pathname = req.nextUrl.pathname;
  const isLoggedIn = !!token;
  const isLoginPage = pathname === '/login';
  const isAuthApi = pathname.startsWith('/api/auth/');
  const isLogoutApi = pathname === '/api/auth/logout';
  const isCronApi = pathname.startsWith('/api/cron/');
  // لوگو/پس‌زمینه لاگین بدون نشست باید در دسترس باشند
  const isPublicBrandingAsset =
    pathname.startsWith('/images/') || pathname.startsWith('/uploads/branding/');

  if (
    !isLoggedIn &&
    !isLoginPage &&
    !isAuthApi &&
    !isLogoutApi &&
    !isCronApi &&
    !isPublicBrandingAsset
  ) {
    const redirect = NextResponse.redirect(adminPublicUrl('login'));
    redirect.headers.set('Content-Security-Policy', csp);
    return redirect;
  }

  if (isLoggedIn && isLoginPage) {
    const redirect = NextResponse.redirect(adminPublicUrl());
    redirect.headers.set('Content-Security-Policy', csp);
    return redirect;
  }

  const role = token?.role as UserRole | undefined;
  const twoFactorEnabled = token?.twoFactorEnabled === true;
  const pendingMandatory2FA =
    isLoggedIn && role && requiresMandatory2FA(role) && !twoFactorEnabled;

  const isSetup2faPage = pathname === '/setup-2fa';
  const is2faApi = pathname.startsWith('/api/auth/2fa/');

  if (
    pendingMandatory2FA &&
    !isSetup2faPage &&
    !is2faApi &&
    !isLogoutApi &&
    pathname !== '/api/auth/refresh'
  ) {
    const redirect = NextResponse.redirect(adminPublicUrl('setup-2fa'));
    redirect.headers.set('Content-Security-Policy', csp);
    return redirect;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', csp);

  if (!req.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), {
      httpOnly: false,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
