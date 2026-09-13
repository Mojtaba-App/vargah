import type { Comment } from '../types';

export const comments: Comment[] = [
  {
    id: 'c-1',
    articleId: 'art-1',
    authorName: 'کاربر نمونه',
    content: 'مقاله بسیار جامع و کاربردی بود. ممنون از تیم تحریریه.',
    createdAt: '2026-08-16T10:30:00',
  },
  {
    id: 'c-2',
    articleId: 'art-1',
    authorName: 'پژوهشگر',
    content: 'لطفاً در مقالات بعدی به بحث زیرساخت ابری هم بپردازید.',
    createdAt: '2026-08-17T14:20:00',
  },
  {
    id: 'c-3',
    articleId: 'art-1',
    authorName: 'مدیر IT',
    content: 'تحلیل دقیقی از وضعیت فعلی ارائه شده. پیشنهاد می‌کنم بخوانید.',
    createdAt: '2026-08-18T09:00:00',
  },
];

export function getCommentsByArticle(articleId: string) {
  return comments.filter((c) => c.articleId === articleId);
}
