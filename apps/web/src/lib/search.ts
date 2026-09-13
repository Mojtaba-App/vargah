/**
 * Persian text normalization for search.
 * Handles: Arabic/Persian character variants, half-space (ZWNJ), diacritics, extra whitespace.
 */
const ARABIC_TO_PERSIAN: Record<string, string> = {
  ك: 'ک',
  ي: 'ی',
  ة: 'ه',
  ى: 'ی',
};

const DIACRITICS_REGEX = /[\u064B-\u065F\u0670]/g;

export function normalizePersianText(text: string): string {
  let normalized = text.trim().toLowerCase();

  for (const [arabic, persian] of Object.entries(ARABIC_TO_PERSIAN)) {
    normalized = normalized.replaceAll(arabic, persian);
  }

  normalized = normalized.replace(DIACRITICS_REGEX, '');
  normalized = normalized.replace(/[\u200C\u200D]/g, '\u200c');
  normalized = normalized.replace(/\u200c+/g, '\u200c');
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

export function persianSearchMatch(query: string, ...fields: string[]): boolean {
  if (!query.trim()) return true;

  const normalizedQuery = normalizePersianText(query);
  const queryParts = normalizedQuery.split(/\s+/).filter(Boolean);

  const normalizedFields = fields.map((f) => normalizePersianText(f)).join(' ');

  return queryParts.every((part) => normalizedFields.includes(part));
}
