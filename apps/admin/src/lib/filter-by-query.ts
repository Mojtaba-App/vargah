export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesSearchQuery(haystack: string, query: string): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

export function collectSearchText(parts: Array<string | null | undefined | number>): string {
  return parts
    .filter((p) => p !== null && p !== undefined && p !== '')
    .map(String)
    .join(' ');
}

export function filterByQuery<T>(
  items: T[],
  query: string,
  getText: (item: T) => string | string[],
): T[] {
  const q = normalizeSearchQuery(query);
  if (!q) return items;

  return items.filter((item) => {
    const raw = getText(item);
    const haystack = Array.isArray(raw) ? collectSearchText(raw) : raw;
    return matchesSearchQuery(haystack, q);
  });
}
