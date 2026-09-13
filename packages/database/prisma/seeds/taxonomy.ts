import type { SeedContext } from './types';

export async function seedTaxonomy({ prisma }: SeedContext) {
  const categories = [
    { name: 'سیاست و جامعه', slug: 'politics' },
    { name: 'اقتصاد', slug: 'economy' },
    { name: 'فرهنگ و هنر', slug: 'culture' },
    { name: 'فناوری', slug: 'technology' },
    { name: 'اخبار', slug: 'news' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const tags = ['تحلیل', 'گفت‌وگو', 'گزارش', 'یادداشت', 'نقد', 'اختصاصی'].map((name, i) => ({
    name,
    slug: ['analysis', 'interview', 'report', 'opinion', 'review', 'exclusive'][i],
  }));

  for (const tag of tags) {
    await prisma.tag.upsert({ where: { slug: tag.slug }, update: {}, create: tag });
  }

  console.log('   🏷️  taxonomy — دسته‌ها و برچسب‌ها');
}
