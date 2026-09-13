'use client';

import { CSRF_COOKIE, CSRF_HEADER } from '@vargah/security/csrf';

export function readCsrfTokenFromDocument(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function csrfHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = readCsrfTokenFromDocument();
  if (token && !headers.has(CSRF_HEADER)) {
    headers.set(CSRF_HEADER, token);
  }
  return headers;
}
