'use client';

import { Suspense, useEffect, useState } from 'react';
import { GoogleAnalytics } from './google-analytics';
import { UmamiAnalytics } from './umami-analytics';
import { InternalAnalyticsBeacon } from './internal-beacon';
import {
  COOKIE_CONSENT_KEY,
  readCookieConsent,
  type CookieConsentValue,
} from '@/components/privacy/cookie-consent-banner';

export function AnalyticsProvider({
  articleId,
  nonce,
}: {
  articleId?: string;
  nonce?: string;
}) {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);

  useEffect(() => {
    setConsent(readCookieConsent());
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentValue>).detail;
      if (detail === 'essential' || detail === 'all') setConsent(detail);
      else setConsent(readCookieConsent());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === COOKIE_CONSENT_KEY) setConsent(readCookieConsent());
    };
    window.addEventListener('vargah:cookie-consent', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('vargah:cookie-consent', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const allowAnalytics = consent === 'all';

  return (
    <>
      {allowAnalytics ? (
        <>
          <GoogleAnalytics nonce={nonce} />
          <UmamiAnalytics nonce={nonce} />
        </>
      ) : null}
      <Suspense fallback={null}>
        <InternalAnalyticsBeacon articleId={articleId} />
      </Suspense>
    </>
  );
}
