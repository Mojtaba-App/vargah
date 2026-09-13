import type { Article } from '../types';
import { mockImages } from './images';

export const articles: Article[] = [
  {
    id: 'art-1',
    slug: 'digital-transformation-iran',
    title: 'تحول دیجیتال در ایران: فرصت‌ها و چالش‌ها',
    excerpt: 'بررسی وضعیت فعلی تحول دیجیتال و نقشه راه پیش رو برای کسب‌وکارهای ایرانی.',
    content: `
      <p>تحول دیجیتال دیگر یک انتخاب نیست؛ ضرورتی است که سازمان‌ها را به سمت نوآوری و بهبود فرآیندها سوق می‌دهد.</p>
      <h2>وضعیت فعلی</h2>
      <p>در سال‌های اخیر، سرعت پذیرش فناوری‌های نوین در بخش خصوصی افزایش یافته است. از پرداخت‌های دیجیتال گرفته تا هوش مصنوعی، همه در حال تغییر چهره کسب‌وکارها هستند.</p>
      <h2>چالش‌های پیش رو</h2>
      <p>با وجود پیشرفت‌ها، هنوز موانعی مانند زیرساخت، آموزش نیروی انسانی و مقررات وجود دارد که نیاز به توجه جدی دارند.</p>
      <p>در این مقاله به بررسی عمیق این موضوعات می‌پردازیم و راهکارهای عملی ارائه می‌دهیم.</p>
    `,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-4',
    tagIds: ['tag-1', 'tag-6'],
    authorId: 'author-2',
    issueId: 'issue-12',
    publishedAt: '2026-08-15',
    readingTimeMinutes: 8,
    isEditorsPick: true,
    isFeatured: true,
  },
  {
    id: 'art-2',
    slug: 'ai-ethics',
    title: 'اخلاق هوش مصنوعی: مرزهای نو',
    excerpt: 'آیا هوش مصنوعی می‌تواند تصمیم‌گیر باشد؟ نگاهی به ابعاد اخلاقی فناوری.',
    content: `<p>هوش مصنوعی در حال تغییر بنیادین نحوه زندگی، کار و تصمیم‌گیری ما است.</p><p>از تشخیص پزشکی تا قضاوت، مرزهای اخلاقی جدیدی مطرح شده که جامعه باید به آن پاسخ دهد.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-4-1',
    tagIds: ['tag-1', 'tag-4'],
    authorId: 'author-2',
    issueId: 'issue-12',
    publishedAt: '2026-08-14',
    readingTimeMinutes: 6,
    isEditorsPick: true,
  },
  {
    id: 'art-3',
    slug: 'urban-development',
    title: 'توسعه شهری پایدار: درس‌هایی از متروپول‌های جهان',
    excerpt: 'چگونه شهرهای ایرانی می‌توانند از تجربه شهرهای پیشرو بهره ببرند.',
    content: `<p>شهرنشینی سریع، چالش‌های جدیدی برای مدیران شهری ایجاد کرده است.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-1',
    tagIds: ['tag-3'],
    authorId: 'author-1',
    issueId: 'issue-12',
    publishedAt: '2026-08-13',
    readingTimeMinutes: 10,
    isFeatured: true,
  },
  {
    id: 'art-4',
    slug: 'literary-review-spring',
    title: 'نقد کتاب: بوی بهار',
    excerpt: 'بررسی رمان جدید یک نویسنده جوان ایرانی.',
    content: `<p>رمان «بوی بهار» روایتگر نسلی است که بین سنت و مدرنیته گیر کرده.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-3-1',
    tagIds: ['tag-5'],
    authorId: 'author-3',
    issueId: 'issue-12',
    publishedAt: '2026-08-12',
    readingTimeMinutes: 5,
  },
  {
    id: 'art-5',
    slug: 'startup-ecosystem',
    title: 'اکوسیستم استارتاپی ایران در ۱۴۰۵',
    excerpt: 'گزارش جامع از وضعیت استارتاپ‌ها و سرمایه‌گذاری خطرپذیر.',
    content: `<p>اکوسیستم استارتاپی ایران در مسیر رشد قرار دارد.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-2-2',
    tagIds: ['tag-3', 'tag-6'],
    authorId: 'author-2',
    issueId: 'issue-12',
    publishedAt: '2026-08-11',
    readingTimeMinutes: 12,
    isFeatured: true,
  },
  {
    id: 'art-6',
    slug: 'inflation-analysis',
    title: 'تحلیل تورم: ریشه‌ها و راهکارها',
    excerpt: 'نگاهی اقتصادی به عوامل مؤثر بر تورم و سیاست‌های پیشنهادی.',
    content: `<p>تورم یکی از چالش‌های اصلی اقتصاد ایران در سال‌های اخیر بوده است.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-2',
    tagIds: ['tag-1'],
    authorId: 'author-2',
    issueId: 'issue-11',
    publishedAt: '2026-07-10',
    readingTimeMinutes: 9,
    isEditorsPick: true,
  },
  {
    id: 'art-7',
    slug: 'market-outlook',
    title: 'چشم‌انداز بازار سرمایه',
    excerpt: 'پیش‌بینی کارشناسان از روند بازار در نیمه دوم سال.',
    content: `<p>بازار سرمایه در انتظار تحولات مهمی است.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-2-1',
    tagIds: ['tag-1', 'tag-3'],
    authorId: 'author-2',
    issueId: 'issue-11',
    publishedAt: '2026-07-08',
    readingTimeMinutes: 7,
  },
  {
    id: 'art-8',
    slug: 'foreign-policy',
    title: 'سیاست خارجی در بزنگاه',
    excerpt: 'تحلیل تحولات منطقه‌ای و موضع ایران.',
    content: `<p>تحولات منطقه‌ای نیاز به بازنگری در سیاست خارجی دارد.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-1-2',
    tagIds: ['tag-1'],
    authorId: 'author-1',
    issueId: 'issue-11',
    publishedAt: '2026-07-05',
    readingTimeMinutes: 11,
  },
  {
    id: 'art-9',
    slug: 'cinema-festival',
    title: 'گزارش جشنواره فیلم: نگاهی نو',
    excerpt: 'مروری بر فیلم‌های برگزیده و روندهای سینمای مستقل.',
    content: `<p>جشنواره امسال شاهد حضور آثار متنوع و جسورانه بود.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-3-2',
    tagIds: ['tag-3', 'tag-5'],
    authorId: 'author-3',
    issueId: 'issue-10',
    publishedAt: '2026-06-05',
    readingTimeMinutes: 6,
  },
  {
    id: 'art-10',
    slug: 'cultural-identity',
    title: 'هویت فرهنگی در عصر جهانی‌شدن',
    excerpt: 'بحثی درباره حفظ هویت در برابر تأثیرات فرهنگی جهانی.',
    content: `<p>جهانی‌شدن فرصت‌ها و تهدیدهایی برای هویت فرهنگی دارد.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-3',
    tagIds: ['tag-4'],
    authorId: 'author-3',
    issueId: 'issue-10',
    publishedAt: '2026-06-03',
    readingTimeMinutes: 8,
  },
  {
    id: 'art-11',
    slug: 'civil-society',
    title: 'جامعه مدنی و مشارکت شهروندی',
    excerpt: 'نقش NGOها در تقویت دموکراسی محلی.',
    content: `<p>جامعه مدنی پillar مهمی از دموکراسی است.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-1',
    tagIds: ['tag-1'],
    authorId: 'author-1',
    issueId: 'issue-9',
    publishedAt: '2026-05-01',
    readingTimeMinutes: 9,
  },
  {
    id: 'art-12',
    slug: 'interview-mayor',
    title: 'گفت‌وگو با شهردار: چشم‌انداز شهر',
    excerpt: 'مصاحبه اختصاصی درباره برنامه‌های توسعه شهری.',
    content: `<p>شهردار در این گفت‌وگو برنامه‌های پنج‌ساله را تشریح کرد.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-1-1',
    tagIds: ['tag-2', 'tag-6'],
    authorId: 'author-4',
    issueId: 'issue-9',
    publishedAt: '2026-04-28',
    readingTimeMinutes: 15,
    isEditorsPick: true,
  },
  {
    id: 'art-13',
    slug: 'spring-special',
    title: 'ویژه بهار: نو شدن',
    excerpt: 'مجموعه یادداشت‌هایی درباره renewal و امید.',
    content: `<p>بهار فصل نو شدن است، در طبیعت و در انسان.</p>`,
    coverImage: mockImages.articleCover,
    categoryId: 'cat-3-1',
    tagIds: ['tag-4'],
    authorId: 'author-3',
    issueId: 'issue-8',
    publishedAt: '2026-03-20',
    readingTimeMinutes: 4,
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByIssue(issueId: string) {
  return articles.filter((a) => a.issueId === issueId);
}

export function getEditorsPicks() {
  return articles.filter((a) => a.isEditorsPick);
}

export function getFeaturedArticles() {
  return articles.filter((a) => a.isFeatured);
}

export function getLatestArticles(limit = 6) {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}

export function getArticlesByCategory(categoryId: string) {
  return articles.filter((a) => a.categoryId === categoryId || a.categoryId.startsWith(categoryId));
}

export function getArticlesByTag(tagId: string) {
  return articles.filter((a) => a.tagIds.includes(tagId));
}

export function getRelatedArticles(article: Article, limit = 3) {
  return articles
    .filter((a) => a.id !== article.id && a.categoryId === article.categoryId)
    .slice(0, limit);
}

export function getArticlesByCategoryGrouped() {
  const grouped: Record<string, Article[]> = {};
  for (const article of articles) {
    const catId = article.categoryId.split('-').slice(0, 2).join('-');
    if (!grouped[catId]) grouped[catId] = [];
    grouped[catId].push(article);
  }
  return grouped;
}
