import { ArticleStatus } from '@vargah/database';

/** تعیین publishedAt هنگام انتشار مقاله */
export function resolvePublishedAt(
  newStatus: ArticleStatus,
  currentPublishedAt: Date | null,
  now = new Date(),
): Date | undefined {
  if (newStatus === ArticleStatus.PUBLISHED) {
    return currentPublishedAt ?? now;
  }
  return undefined;
}

/** آیا پس از تغییر وضعیت، کش سایت عمومی باید باطل شود؟ */
export function shouldRevalidateOnPublish(
  newStatus: ArticleStatus,
  previousStatus: ArticleStatus,
): boolean {
  return newStatus === ArticleStatus.PUBLISHED || previousStatus === ArticleStatus.PUBLISHED;
}
