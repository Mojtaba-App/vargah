/** نگاشت ساده فارسی → لاتین برای slug خوانا */
const FA_TO_LATIN: Record<string, string> = {
  آ: 'a',
  ا: 'a',
  ب: 'b',
  پ: 'p',
  ت: 't',
  ث: 's',
  ج: 'j',
  چ: 'ch',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'z',
  ر: 'r',
  ز: 'z',
  ژ: 'zh',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'z',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'gh',
  ک: 'k',
  گ: 'g',
  ل: 'l',
  م: 'm',
  ن: 'n',
  و: 'v',
  ه: 'h',
  ی: 'y',
  ئ: 'y',
  ء: '',
  '‌': '-',
  ' ': '-',
};

export type SlugMode = 'persian' | 'latin';

/**
 * تولید slug فارسی‌دوست:
 * - persian: حفظ حروف فارسی (URL-encoded در مرورگر)
 * - latin: تلفظ لاتین تمیز برای سازگاری بیشتر
 */
export function createSlug(text: string, mode: SlugMode = 'latin'): string {
  const trimmed = text.trim();
  if (!trimmed) return `item-${Date.now().toString(36)}`;

  if (mode === 'persian') {
    const slug = trimmed
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}\-]/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
    return slug || `item-${Date.now().toString(36)}`;
  }

  let latin = '';
  for (const char of trimmed) {
    if (FA_TO_LATIN[char] !== undefined) {
      latin += FA_TO_LATIN[char];
    } else if (/[a-zA-Z0-9]/.test(char)) {
      latin += char.toLowerCase();
    } else if (char === ' ' || char === '-' || char === '_') {
      latin += '-';
    }
  }

  const slug = latin
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return slug || `item-${Date.now().toString(36)}`;
}

export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
