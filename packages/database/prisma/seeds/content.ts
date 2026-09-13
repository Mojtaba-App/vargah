import type { SeedContext, SeedUsers } from './types';

export async function seedContent(ctx: SeedContext, users: SeedUsers) {
  const { prisma } = ctx;

  await prisma.issue.upsert({
    where: { number: 12 },
    update: {},
    create: {
      number: 12,
      title: 'شماره ۱۲ — آینده دیجیتال',
      slug: 'shomare-12-ayande-digital',
      description: 'ویژه‌نامه فناوری',
      pageCount: 84,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-08-15'),
      coverImage: '/images/hero-vargah.jpg',
    },
  });

  const politicsCat = await prisma.category.findUnique({ where: { slug: 'politics' } });
  const techCat = await prisma.category.findUnique({ where: { slug: 'technology' } });
  const issue12 = await prisma.issue.findUnique({ where: { number: 12 } });

  const sampleArticles = [
    {
      title: 'تحول دیجیتال در رسانه‌های فارسی',
      slug: 'tahavvol-digital-resaneh-farsi',
      excerpt: 'نگاهی به چالش‌ها و فرصت‌های رسانه‌های آنلاین فارسی‌زبان در دهه جدید.',
      content:
        '<p>رسانه‌های دیجیتال فارسی در سال‌های اخیر رشد چشمگیری داشته‌اند. از پادکست تا خبرنامه‌های تخصصی، مخاطب ایرانی به محتوای باکیفیت و عمیق روی آورده است.</p><p>در این گزارش به بررسی مدل‌های درآمدی، SEO فارسی و تعامل مخاطب می‌پردازیم.</p>',
      categoryId: techCat?.id,
      isFeatured: true,
      isEditorsPick: true,
    },
    {
      title: 'یادداشتی بر تحولات سیاسی منطقه',
      slug: 'yaddasht-tahavvolat-siasi',
      excerpt: 'تحلیل کوتاه از تحولات اخیر در منطقه و پیامدهای آن برای ایران.',
      content:
        '<p>تحولات منطقه‌ای همواره بر سیاست داخلی اثرگذار بوده است. در این یادداشت به پیوند این دو سطح پرداخته می‌شود.</p>',
      categoryId: politicsCat?.id,
      isEditorsPick: true,
    },
  ];

  for (const art of sampleArticles) {
    await prisma.article.upsert({
      where: { slug: art.slug },
      update: { status: 'PUBLISHED', publishedAt: new Date('2026-08-20') },
      create: {
        ...art,
        status: 'PUBLISHED',
        publishedAt: new Date('2026-08-20'),
        authorId: users.writer.id,
        issueId: issue12?.id,
        readingTime: 6,
        metaTitle: art.title,
        metaDescription: art.excerpt,
        ogImage: '/images/hero-vargah.jpg',
      },
    });
  }

  console.log('   📰 content — شماره ۱۲ و مقالات نمونه');
}
