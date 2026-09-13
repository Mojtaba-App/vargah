import DOMPurify from 'isomorphic-dompurify';

const ARTICLE_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'hr', 'span',
];

const ARTICLE_ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'];

let hooksInstalled = false;

function ensureSanitizeHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A') return;
    const href = node.getAttribute('href');
    if (!href) return;
    const rel = new Set(
      (node.getAttribute('rel') ?? '')
        .split(/\s+/)
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean),
    );
    rel.add('noopener');
    rel.add('noreferrer');
    node.setAttribute('rel', Array.from(rel).join(' '));
    if (node.getAttribute('target') === '_blank') {
      // already covered by noopener
    }
  });
}

/** Sanitize HTML ویرایشگر محتوا — محافظت XSS */
export function sanitizeArticleHtml(dirty: string): string {
  ensureSanitizeHooks();
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ARTICLE_ALLOWED_TAGS,
    ALLOWED_ATTR: ARTICLE_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

/** Sanitize ساده برای متن‌های کاربر */
export function sanitizePlainText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
