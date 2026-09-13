import { ADMIN_BASE_PATH, adminPath } from '@/lib/base-path';

export type BrandingAssetTarget = 'web' | 'admin';

export const DEFAULT_ADMIN_LOGO = '/images/vargah-logo.svg';
export const DEFAULT_LOGIN_BACKGROUND = '/images/login-landscape.svg';

const LEGACY_BROKEN_LOGO = '/images/vargah-logo.png';
const LEGACY_BROKEN_BACKGROUND = '/images/login-landscape.webp';

export function normalizeBrandingAssetPath(src: string | null | undefined): string | null {
  if (!src?.trim()) return null;
  const trimmed = src.trim();
  const pathOnly = trimmed.split('?')[0] ?? trimmed;
  if (pathOnly === LEGACY_BROKEN_LOGO) return DEFAULT_ADMIN_LOGO;
  if (pathOnly === LEGACY_BROKEN_BACKGROUND) return DEFAULT_LOGIN_BACKGROUND;
  return trimmed;
}

export function resolveBrandingAssetSrc(
  src: string | null | undefined,
  target: BrandingAssetTarget = 'admin',
) {
  const normalized = normalizeBrandingAssetPath(src);
  if (!normalized) return null;
  if (normalized.startsWith('http') || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  const [pathPart, query = ''] = normalized.split('?');
  let path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;

  if (path.startsWith(`${ADMIN_BASE_PATH}/`)) {
    path = path.slice(ADMIN_BASE_PATH.length) || '/';
  }

  const resolved = target === 'admin' ? adminPath(path) : path;
  return query ? `${resolved}?${query}` : resolved;
}

export function resolveAdminLogoSrc(
  loginLogo?: string | null,
  adminLogo?: string | null,
): string {
  return (
    resolveBrandingAssetSrc(loginLogo, 'admin') ??
    resolveBrandingAssetSrc(adminLogo, 'admin') ??
    adminPath(DEFAULT_ADMIN_LOGO)
  );
}
