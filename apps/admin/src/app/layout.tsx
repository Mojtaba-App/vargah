import '@vargah/ui/globals.css';

import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { resolveBrandingAssetSrc } from '@/lib/branding-assets';
import { getSiteConfig } from '@/lib/site-config';
import {
  isThemeSetting,
  resolveThemePreference,
  THEME_COOKIE_NAME,
  type ResolvedTheme,
} from '@/lib/theme';

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  const favicon =
    resolveBrandingAssetSrc(siteConfig.branding.favicon, 'web') ?? siteConfig.branding.favicon;

  return {
    title: {
      default: `پنل مدیریت — ${siteConfig.branding.siteName}`,
      template: `%s | ${siteConfig.branding.siteName}`,
    },
    description: 'پنل مدیریت محتوای ماهنامه',
    icons: {
      icon: favicon,
    },
  };
}

async function resolveServerTheme(): Promise<ResolvedTheme> {
  const cookieStore = await cookies();
  const headersList = await headers();
  const stored = cookieStore.get(THEME_COOKIE_NAME)?.value;
  const theme = isThemeSetting(stored) ? stored : 'system';
  const prefersDark = headersList.get('sec-ch-prefers-color-scheme') === 'dark';
  return resolveThemePreference(theme, prefersDark);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const resolvedTheme = await resolveServerTheme();

  return (
    <html
      lang="fa"
      dir="rtl"
      className={resolvedTheme === 'dark' ? 'dark' : undefined}
      style={{ colorScheme: resolvedTheme }}
      suppressHydrationWarning
    >
      <body className="overflow-x-hidden font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
