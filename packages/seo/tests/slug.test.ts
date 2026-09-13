import { describe, expect, it } from 'vitest';
import { createSlug, ensureUniqueSlug } from '@vargah/seo/slug';

describe('createSlug', () => {
  it('creates latin slug from persian title', () => {
    expect(createSlug('تحول دیجیتال در رسانه', 'latin')).toBe('thvl-dyjytal-dr-rsanh');
  });

  it('preserves persian characters in persian mode', () => {
    expect(createSlug('تحول دیجیتال', 'persian')).toBe('تحول-دیجیتال');
  });

  it('ensures unique slug with suffix', async () => {
    const slug = await ensureUniqueSlug('test-article', async (s) => s === 'test-article');
    expect(slug).toBe('test-article-2');
  });
});
