import type { Issue } from '../types';
import { mockImages } from './images';

export const issues: Issue[] = [
  {
    id: 'issue-12',
    slug: 'issue-12',
    number: 12,
    title: 'شماره ۱۲ — آینده‌ی دیجیتال',
    coverImage: mockImages.issueCover,
    publishedAt: '2026-08-15',
    pageCount: 84,
    pdfUrl: '/mock/issue-12.pdf',
    description: 'ویژه‌نامه فناوری و تحول دیجیتال در ایران.',
    articleIds: ['art-1', 'art-2', 'art-3', 'art-4', 'art-5'],
  },
  {
    id: 'issue-11',
    slug: 'issue-11',
    number: 11,
    title: 'شماره ۱۱ — اقتصاد معاصر',
    coverImage: mockImages.issueCover,
    publishedAt: '2026-07-10',
    pageCount: 76,
    pdfUrl: '/mock/issue-11.pdf',
    description: 'بررسی چالش‌ها و فرصت‌های اقتصادی.',
    articleIds: ['art-6', 'art-7', 'art-8'],
  },
  {
    id: 'issue-10',
    slug: 'issue-10',
    number: 10,
    title: 'شماره ۱۰ — فرهنگ و هویت',
    coverImage: mockImages.issueCover,
    publishedAt: '2026-06-05',
    pageCount: 72,
    pdfUrl: '/mock/issue-10.pdf',
    description: 'نگاهی به تحولات فرهنگی و هنری.',
    articleIds: ['art-9', 'art-10'],
  },
  {
    id: 'issue-9',
    slug: 'issue-9',
    number: 9,
    title: 'شماره ۹ — جامعه مدنی',
    coverImage: mockImages.issueCover,
    publishedAt: '2026-05-01',
    pageCount: 68,
    pdfUrl: '/mock/issue-9.pdf',
    description: 'تحلیل مسائل اجتماعی و مدنی.',
    articleIds: ['art-11', 'art-12'],
  },
  {
    id: 'issue-8',
    slug: 'issue-8',
    number: 8,
    title: 'شماره ۸ — بهار ۱۴۰۴',
    coverImage: mockImages.issueCover,
    publishedAt: '2026-03-20',
    pageCount: 64,
    pdfUrl: '/mock/issue-8.pdf',
    description: 'مجموعه مقالات فصل بهار.',
    articleIds: ['art-13'],
  },
];

export function getLatestIssue() {
  return issues[0];
}

export function getIssueBySlug(slug: string) {
  return issues.find((i) => i.slug === slug);
}

export function filterIssues(year?: number, month?: number) {
  return issues.filter((issue) => {
    const date = new Date(issue.publishedAt);
    if (year && date.getFullYear() !== year) return false;
    if (month && date.getMonth() + 1 !== month) return false;
    return true;
  });
}

export function getIssueYears() {
  const years = new Set(issues.map((i) => new Date(i.publishedAt).getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}
