'use client';

import Script from 'next/script';

const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL;
const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export function UmamiAnalytics({ nonce }: { nonce?: string }) {
  if (!UMAMI_URL || !UMAMI_ID) return null;

  const src = UMAMI_URL.endsWith('/') ? `${UMAMI_URL}script.js` : `${UMAMI_URL}/script.js`;

  return (
    <Script defer src={src} data-website-id={UMAMI_ID} strategy="afterInteractive" nonce={nonce} />
  );
}
