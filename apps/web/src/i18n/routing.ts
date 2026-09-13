import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fa'],
  defaultLocale: 'fa',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  fa: 'فارسی',
};
