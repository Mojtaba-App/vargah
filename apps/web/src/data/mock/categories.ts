import type { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'cat-1',
    slug: 'politics',
    name: 'سیاست و جامعه',
    children: [
      { id: 'cat-1-1', slug: 'domestic', name: 'سیاست داخلی', parentId: 'cat-1' },
      { id: 'cat-1-2', slug: 'international', name: 'سیاست بین‌الملل', parentId: 'cat-1' },
    ],
  },
  {
    id: 'cat-2',
    slug: 'economy',
    name: 'اقتصاد',
    children: [
      { id: 'cat-2-1', slug: 'market', name: 'بازار سرمایه', parentId: 'cat-2' },
      { id: 'cat-2-2', slug: 'startup', name: 'استارتاپ', parentId: 'cat-2' },
    ],
  },
  {
    id: 'cat-3',
    slug: 'culture',
    name: 'فرهنگ و هنر',
    children: [
      { id: 'cat-3-1', slug: 'literature', name: 'ادبیات', parentId: 'cat-3' },
      { id: 'cat-3-2', slug: 'cinema', name: 'سینما', parentId: 'cat-3' },
    ],
  },
  {
    id: 'cat-4',
    slug: 'technology',
    name: 'فناوری',
    children: [
      { id: 'cat-4-1', slug: 'ai', name: 'هوش مصنوعی', parentId: 'cat-4' },
      { id: 'cat-4-2', slug: 'web', name: 'وب و نرم‌افزار', parentId: 'cat-4' },
    ],
  },
  {
    id: 'cat-5',
    slug: 'news',
    name: 'اخبار',
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  for (const cat of categories) {
    if (cat.slug === slug) return cat;
    if (cat.children) {
      const child = cat.children.find((c) => c.slug === slug);
      if (child) return child;
    }
  }
  return undefined;
}

export function getAllCategoriesFlat(): Category[] {
  const flat: Category[] = [];
  for (const cat of categories) {
    flat.push(cat);
    if (cat.children) flat.push(...cat.children);
  }
  return flat;
}
