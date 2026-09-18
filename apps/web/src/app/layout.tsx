import '@vargah/ui/globals.css';

import { cookies, headers } from 'next/headers';

import { ThemeProvider } from '@/components/providers/theme-provider';
import {
  isThemeSetting,
  resolveThemePreference,
  THEME_COOKIE_NAME,
  type ResolvedTheme,
} from '@/lib/theme';

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
      <body className="text-start font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
