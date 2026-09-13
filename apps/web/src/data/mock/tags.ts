import type { Tag } from '../types';

export const tags: Tag[] = [
  { id: 'tag-1', slug: 'analysis', name: 'تحلیل' },
  { id: 'tag-2', slug: 'interview', name: 'گفت‌وگو' },
  { id: 'tag-3', slug: 'report', name: 'گزارش' },
  { id: 'tag-4', slug: 'opinion', name: 'یادداشت' },
  { id: 'tag-5', slug: 'review', name: 'نقد' },
  { id: 'tag-6', slug: 'exclusive', name: 'اختصاصی' },
];

export function getTagBySlug(slug: string) {
  return tags.find((t) => t.slug === slug);
}

export function getTagsByIds(ids: string[]) {
  return tags.filter((t) => ids.includes(t.id));
}
