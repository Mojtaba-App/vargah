'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function classifySource(referrer: string): string {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('google') || host.includes('bing') || host.includes('yahoo'))
      return 'organic';
    if (
      host.includes('t.me') ||
      host.includes('instagram') ||
      host.includes('twitter') ||
      host.includes('x.com')
    ) {
      return 'social';
    }
    if (host.includes('mail')) return 'email';
    return 'referral';
  } catch {
    return 'referral';
  }
}

export function InternalAnalyticsBeacon({ articleId }: { articleId?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;

    const payload = {
      path,
      articleId,
      referrer: document.referrer || null,
      source: classifySource(document.referrer),
    };

    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/collect', body);
      return;
    }

    fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname, searchParams, articleId]);

  return null;
}
