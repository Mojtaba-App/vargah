import { unstable_cache } from 'next/cache';
import { prisma } from '@vargah/database';

export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  children: PublicCategory[];
};

async function getCategoryTree(): Promise<PublicCategory[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, slug: true, name: true, parentId: true },
  });

  const byParent = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const key = row.parentId;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }

  const build = (parentId: string | null): PublicCategory[] =>
    (byParent.get(parentId) ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      parentId: row.parentId,
      children: build(row.id),
    }));

  return build(null);
}

export const getCachedCategoryTree = unstable_cache(getCategoryTree, ['category-tree'], {
  tags: ['categories', 'articles'],
  revalidate: 3600,
});

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: { slug },
    select: { id: true, slug: true, name: true, parentId: true },
  });
}

export const getCachedCategoryBySlug = (slug: string) =>
  unstable_cache(() => getCategoryBySlug(slug), ['category', slug], {
    tags: ['categories', `category:${slug}`],
    revalidate: 3600,
  })();

export async function getPublicTags(limit = 40) {
  return prisma.tag.findMany({
    orderBy: { name: 'asc' },
    take: limit,
    select: { id: true, slug: true, name: true },
  });
}

export const getCachedPublicTags = unstable_cache(() => getPublicTags(40), ['public-tags'], {
  tags: ['tags', 'articles'],
  revalidate: 3600,
});
