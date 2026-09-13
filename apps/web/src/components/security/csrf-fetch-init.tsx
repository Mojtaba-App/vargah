'use client';

import { useEffect } from 'react';

import { CSRF_COOKIE, CSRF_HEADER } from '@vargah/security/csrf';

function readCsrfToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function shouldAttachCsrf(input: RequestInfo | URL): boolean {
  const raw =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  if (
    raw.startsWith('data:') ||
    raw.startsWith('blob:') ||
    raw.startsWith('about:') ||
    raw.startsWith('mailto:')
  ) {
    return false;
  }

  try {
    const resolved = new URL(raw, window.location.origin);
    return resolved.origin === window.location.origin;
  } catch {
    return false;
  }
}

/** تزریق x-csrf-token برای درخواست‌های same-origin سایت */
export function CsrfFetchInit() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      if (!shouldAttachCsrf(input)) {
        return originalFetch(input, init);
      }

      const token = readCsrfToken();
      if (!token) return originalFetch(input, init);

      const headers = new Headers(init?.headers);
      if (!headers.has(CSRF_HEADER)) {
        headers.set(CSRF_HEADER, token);
      }

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
