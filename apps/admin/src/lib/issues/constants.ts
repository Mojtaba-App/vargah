import { IssueStatus } from '@vargah/database/enums';
import { parseIssueTocEntries, type IssueTocEntry } from '@vargah/business/issue-toc';

export { parseIssueTocEntries, type IssueTocEntry };

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  DRAFT: 'پیش‌نویس',
  SCHEDULED: 'زمان‌بندی',
  PUBLISHED: 'منتشرشده',
  ARCHIVED: 'آرشیو',
};

export const ISSUE_STATUS_VARIANT: Record<
  IssueStatus,
  'default' | 'secondary' | 'outline' | 'success' | 'destructive'
> = {
  DRAFT: 'secondary',
  SCHEDULED: 'default',
  PUBLISHED: 'success',
  ARCHIVED: 'destructive',
};

export function getPublicIssueUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  return `${base}/fa/issues/${slug}`;
}
