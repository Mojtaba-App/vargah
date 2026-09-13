import { describe, expect, it } from 'vitest';
import { sanitizeArticleHtml, sanitizePlainText } from '@vargah/security/sanitize';

describe('sanitize', () => {
  it('removes script tags from article html', () => {
    const dirty = '<p>سلام</p><script>alert(1)</script>';
    expect(sanitizeArticleHtml(dirty)).not.toContain('<script');
    expect(sanitizeArticleHtml(dirty)).toContain('<p>سلام</p>');
  });

  it('strips all html from plain text', () => {
    expect(sanitizePlainText('<b>test</b>')).toBe('test');
  });
});
