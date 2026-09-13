export function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`;
}

export function resolveAvatarSrc(avatar: string | null | undefined) {
  if (!avatar) return null;
  if (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.startsWith('blob:')) {
    return avatar;
  }

  const [pathPart, query = ''] = avatar.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return query ? `${path}?${query}` : path;
}
