import { ArticleStatus, WorkflowStage } from '@vargah/database/enums';

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: 'پیش‌نویس',
  SUBMITTED: 'ارسال‌شده',
  IN_REVIEW: 'در بازبینی',
  APPROVED: 'تأییدشده',
  SCHEDULED: 'زمان‌بندی',
  PUBLISHED: 'منتشرشده',
  ARCHIVED: 'آرشیو',
};

export const ARTICLE_STATUS_VARIANT: Record<
  ArticleStatus,
  'default' | 'secondary' | 'outline' | 'success' | 'destructive'
> = {
  DRAFT: 'secondary',
  SUBMITTED: 'outline',
  IN_REVIEW: 'default',
  APPROVED: 'success',
  SCHEDULED: 'default',
  PUBLISHED: 'success',
  ARCHIVED: 'destructive',
};

export const WORKFLOW_STAGE_LABELS: Record<WorkflowStage, string> = {
  WRITER: 'نویسنده',
  COPY_EDITOR: 'ویراستار',
  EDITOR_IN_CHIEF: 'سردبیر',
  PUBLISHED: 'انتشار',
};

export const ARTICLE_STATUS_OPTIONS = Object.entries(ARTICLE_STATUS_LABELS).map(([value, label]) => ({
  value: value as ArticleStatus,
  label,
}));

export function getPublicArticleUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  return `${base}/fa/articles/${slug}`;
}

/** مسیرهای /uploads روی دیسک وب هستند؛ برای پیش‌نمایش در پنل از آدرس سایت استفاده می‌شود. */
export function publicAssetUrl(path: string) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/uploads/')) return path;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  if (typeof window !== 'undefined' && window.location.origin === base) return path;
  return `${base}${path}`;
}
