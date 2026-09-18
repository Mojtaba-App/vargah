import { headers, cookies } from 'next/headers';
import { CSRF_COOKIE, CSRF_HEADER, verifyCsrfToken } from '@vargah/security/csrf';

function parseCookieHeader(header: string, name: string): string | undefined {
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return undefined;
}

function assertCsrf(cookieToken: string | undefined, headerToken: string | undefined): void {
  if (verifyCsrfToken(cookieToken, headerToken)) return;
  throw new Error('CSRF_VALIDATION_FAILED');
}

export async function verifyCsrfFromRequest(): Promise<void> {
  const hdrs = await headers();
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = hdrs.get(CSRF_HEADER) ?? undefined;
  assertCsrf(cookieToken, headerToken);
}

/** CSRF برای Route Handlers (multipart upload و ...) */
export function verifyCsrfFromHttpRequest(request: Request): void {
  const cookieToken = parseCookieHeader(request.headers.get('cookie') ?? '', CSRF_COOKIE);
  const headerToken = request.headers.get(CSRF_HEADER) ?? undefined;
  assertCsrf(cookieToken, headerToken);
}

export async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return (
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip')?.trim() || 'unknown'
  );
}

export async function getUserAgent(): Promise<string | undefined> {
  const hdrs = await headers();
  return hdrs.get('user-agent') ?? undefined;
}
