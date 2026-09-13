'use client';

import * as React from 'react';

import {
  applyResolvedTheme,
  persistThemePreference,
  readStoredThemePreference,
  readSystemPrefersDark,
  resolveThemePreference,
  type ResolvedTheme,
  type ThemeSetting,
} from '@/lib/theme';

export type { ThemeSetting } from '@/lib/theme';

type ThemeContextValue = {
  theme: ThemeSetting;
  setTheme: (theme: ThemeSetting) => void;
  resolvedTheme: ResolvedTheme;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: ThemeSetting): ResolvedTheme {
  return resolveThemePreference(theme, readSystemPrefersDark());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeSetting>('system');
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>('light');

  React.useLayoutEffect(() => {
    const stored = readStoredThemePreference();
    const resolved = resolveTheme(stored);
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyResolvedTheme(resolved);
    persistThemePreference(stored);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => {
      const current = readStoredThemePreference();
      if (current === 'system') {
        const next = resolveTheme('system');
        setResolvedTheme(next);
        applyResolvedTheme(next);
      }
    };
    media.addEventListener('change', onMediaChange);
    return () => media.removeEventListener('change', onMediaChange);
  }, []);

  const setTheme = React.useCallback((next: ThemeSetting) => {
    persistThemePreference(next);
    const resolved = resolveTheme(next);
    setThemeState(next);
    setResolvedTheme(resolved);
    applyResolvedTheme(resolved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
