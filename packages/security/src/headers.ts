import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

/** دامنه‌های مجاز برای iframe نقشه در صفحه تماس */
const MAP_FRAME_SRC = [
  "'self'",
  'https://www.openstreetmap.org',
  'https://openstreetmap.org',
  'https://www.google.com',
  'https://maps.google.com',
  'https://www.google.com/maps',
  'https://map.neshan.org',
  'https://maps.neshan.org',
  'https://neshan.org',
  'https://balad.ir',
  'https://www.balad.ir',
  'https://map.ir',
  'https://embed.waze.com',
].join(' ');

function analyticsScriptHosts(): string {
  const hosts = new Set([
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://analytics.google.com',
  ]);
  const umami = process.env.NEXT_PUBLIC_UMAMI_URL;
  if (umami) {
    try {
      hosts.add(new URL(umami).origin);
    } catch {
      /* ignore invalid URL */
    }
  }
  return [...hosts].join(' ');
}

/**
 * CSP با nonce — بدون script-src unsafe-inline وقتی nonce هست.
 * در development، React برای debug به unsafe-eval نیاز دارد؛ در production حذف است.
 * style-src هنوز unsafe-inline دارد (Tailwind / inline styleهای Next رایج).
 */
export function buildContentSecurityPolicy(nonce?: string): string {
  const scriptHosts = analyticsScriptHosts();
  const evalPart = isProd ? '' : " 'unsafe-eval'";
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${evalPart} ${scriptHosts}`
    : `script-src 'self'${evalPart} ${scriptHosts}`;

  const directives = [
    "default-src 'self'",
    scriptSrc,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
    "child-src 'self' https://www.openstreetmap.org https://openstreetmap.org",
    `frame-src ${MAP_FRAME_SRC}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (isProd) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/** هدرهای امنیتی بدون CSP (CSP در middleware با nonce ست می‌شود) */
export const BASE_SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

/** @deprecated ترجیح: BASE + buildContentSecurityPolicy(nonce) در middleware */
export const SECURITY_HEADERS = [
  ...BASE_SECURITY_HEADERS,
  {
    key: 'Content-Security-Policy',
    // بدون nonce: script بدون unsafe-inline/unsafe-eval؛ Next middleware باید nonce بگذارد
    value: buildContentSecurityPolicy(),
  },
];

export function createCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function withSecurityHeaders(config: NextConfig = {}): NextConfig {
  return {
    ...config,
    async headers() {
      const existing = (await config.headers?.()) ?? [];
      return [
        ...existing,
        {
          source: '/(.*)',
          headers: BASE_SECURITY_HEADERS,
        },
      ];
    },
  };
}
