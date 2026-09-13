import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { CSRF_COOKIE, generateCsrfToken } from '@vargah/security/csrf';
import { buildContentSecurityPolicy, createCspNonce } from '@vargah/security/headers';

import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

function normalizeAdminPath(pathname: string) {
  if (pathname === '/fa/admin' || pathname === '/en/admin') {
    return '/admin';
  }

  if (pathname.startsWith('/fa/admin/') || pathname.startsWith('/en/admin/')) {
    return pathname.replace(/^\/(fa|en)/, '');
  }

  return null;
}

/** مسیرهای قدیمی انگلیسی را به معادل فارسی هدایت می‌کند */
function stripEnglishPrefix(pathname: string): string | null {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return null;
}

function withCsrfCookie(response: NextResponse, request: NextRequest) {
  if (!request.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
  return response;
}

function withCsp(response: NextResponse, nonce: string) {
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(nonce));
  return response;
}

export function proxy(request: NextRequest) {
  const nonce = createCspNonce();
  const csp = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Next.js از CSP درخواست برای nonce اسکریپت‌های خودش استفاده می‌کند
  requestHeaders.set('Content-Security-Policy', csp);
  const requestWithNonce = new NextRequest(request, { headers: requestHeaders });

  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') === 'http'
  ) {
    const host = request.headers.get('host') ?? request.nextUrl.host;
    const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    return withCsp(NextResponse.redirect(`https://${host}${path}`, 301), nonce);
  }

  const { pathname } = request.nextUrl;

  const englishPath = stripEnglishPrefix(pathname);
  if (englishPath !== null) {
    const target = new URL(englishPath, request.url);
    target.search = request.nextUrl.search;
    return withCsp(NextResponse.redirect(target, 308), nonce);
  }

  if (pathname === '/login' || pathname === '/fa/login') {
    return withCsp(NextResponse.redirect(new URL('/admin/login', request.url)), nonce);
  }

  const adminRedirect = normalizeAdminPath(pathname);
  if (adminRedirect) {
    return withCsp(NextResponse.redirect(new URL(adminRedirect, request.url)), nonce);
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return withCsrfCookie(withCsp(NextResponse.next({ request: { headers: requestHeaders } }), nonce), request);
  }

  const response = intlMiddleware(requestWithNonce);
  return withCsrfCookie(withCsp(response, nonce), request);
}

export const config = {
  matcher: [
    '/',
    '/(fa|en)/:path*',
    '/admin',
    '/admin/:path*',
    '/login',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
