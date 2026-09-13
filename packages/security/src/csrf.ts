const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

export { CSRF_COOKIE, CSRF_HEADER };

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** سازگار با Edge Runtime و Node.js */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashCsrfToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(hash));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Double-submit cookie: توکن در کوکی و هدر باید یکسان باشند */
export function verifyCsrfToken(
  cookieToken: string | undefined,
  headerToken: string | undefined,
): boolean {
  if (!cookieToken || !headerToken) return false;
  return constantTimeEqual(cookieToken, headerToken);
}
