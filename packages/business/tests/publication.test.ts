import { describe, expect, it } from 'vitest';
import { ArticleStatus } from '@prisma/client';
import { resolvePublishedAt, shouldRevalidateOnPublish } from '../src/publication';

describe('publication helpers', () => {
  const now = new Date('2026-08-20T10:00:00');

  it('sets publishedAt on first publish', () => {
    const publishedAt = resolvePublishedAt(ArticleStatus.PUBLISHED, null, now);
    expect(publishedAt).toEqual(now);
  });

  it('keeps existing publishedAt on re-publish', () => {
    const existing = new Date('2026-08-01');
    const publishedAt = resolvePublishedAt(ArticleStatus.PUBLISHED, existing, now);
    expect(publishedAt).toEqual(existing);
  });

  it('does not set publishedAt for draft', () => {
    expect(resolvePublishedAt(ArticleStatus.DRAFT, null, now)).toBeUndefined();
  });

  it('revalidates when publishing or unpublishing', () => {
    expect(shouldRevalidateOnPublish(ArticleStatus.PUBLISHED, ArticleStatus.DRAFT)).toBe(true);
    expect(shouldRevalidateOnPublish(ArticleStatus.DRAFT, ArticleStatus.PUBLISHED)).toBe(true);
    expect(shouldRevalidateOnPublish(ArticleStatus.DRAFT, ArticleStatus.IN_REVIEW)).toBe(false);
  });
});
