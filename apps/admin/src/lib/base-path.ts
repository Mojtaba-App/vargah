export const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? '/admin';

export function adminPath(path = '') {
  if (!path || path === '/') {
    return ADMIN_BASE_PATH;
  }

  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${ADMIN_BASE_PATH}${suffix}`;
}

/** Absolute admin URL for redirects (works behind web proxy on :3000). */
export function adminPublicUrl(path = '') {
  const publicBase = process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, '');
  if (publicBase) {
    if (!path || path === '/') {
      return publicBase;
    }

    const suffix = path.startsWith('/') ? path : `/${path}`;
    return `${publicBase}${suffix}`;
  }

  return adminPath(path);
}

export function adminApiPath(path: string) {
  return adminPath(path);
}
