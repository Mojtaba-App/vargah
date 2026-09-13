export const THEME_STORAGE_KEY = 'vargah-theme';
export const THEME_COOKIE_NAME = 'vargah-theme';

export type ThemeSetting = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function isThemeSetting(value: string | undefined | null): value is ThemeSetting {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveThemePreference(
  theme: ThemeSetting,
  prefersDark: boolean,
): ResolvedTheme {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return prefersDark ? 'dark' : 'light';
}

export function readSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
}

export function persistThemePreference(theme: ThemeSetting) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

export function readStoredThemePreference(): ThemeSetting {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeSetting(stored) ? stored : 'system';
}
