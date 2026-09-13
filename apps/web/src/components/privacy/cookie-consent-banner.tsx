'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@vargah/ui/components/button';

export const COOKIE_CONSENT_KEY = 'vargah_cookie_consent';
export type CookieConsentValue = 'essential' | 'all';

export function readCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === 'essential' || value === 'all') return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookieConsent() === null);
  }, []);

  function choose(value: CookieConsentValue) {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
      window.dispatchEvent(new CustomEvent('vargah:cookie-consent', { detail: value }));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md"
      role="dialog"
      aria-label="رضایت کوکی"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">
          کوکی‌های ضروری برای کارکرد سایت لازم‌اند. کوکی‌های تحلیلی فقط با رضایت شما فعال
          می‌شوند.{' '}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            حریم خصوصی
          </Link>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => choose('essential')}>
            فقط ضروری
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => choose('all')}>
            پذیرش همه
          </Button>
        </div>
      </div>
    </div>
  );
}
