import type { AdPlacement, AdPricing, AdPortfolio, JobOpening } from './services-content-types';
import { getSchematicSlot, isAdSurfaceId } from './services-content-types';

export * from './services-content-types';

export const SERVICES_CONTENT_KEY = 'services_content';

export const DEFAULT_SERVICES_NAV = [
  {
    href: '/collaborate',
    label: 'همکاری با ما',
    description: 'ارسال مقاله، فرصت‌های فریلنس و همکاری با تحریریه',
    icon: 'collaborate' as const,
    featured: true,
  },
  {
    href: '/advertising',
    label: 'تبلیغات و آگهی',
    description: 'تعرفه چاپی و دیجیتال، درخواست کمپین و نمونه‌کار',
    icon: 'advertising' as const,
    featured: true,
  },
  {
    href: '/subscription',
    label: 'خرید اشتراک',
    description: 'پلن دیجیتال، چاپی و ترکیبی با پرداخت آنلاین',
    icon: 'subscription' as const,
  },
  {
    href: '/contact',
    label: 'تماس با ما',
    description: 'پیشنهاد، انتقاد و ارتباط مستقیم با تحریریه',
    icon: 'contact' as const,
  },
];

export const DEFAULT_AD_PRICING: AdPricing[] = [
  {
    id: 'ad-1',
    type: 'print',
    name: 'صفحه کامل',
    size: 'A4 تمام‌صفحه',
    price: 15000000,
    description: 'تبلیغ تمام‌صفحه در شماره چاپی ماهنامه',
    placementId: 'place-mag-full',
    isActive: true,
  },
  {
    id: 'ad-2',
    type: 'print',
    name: 'نیم‌صفحه',
    size: 'A4 نیم‌صفحه',
    price: 9000000,
    description: 'تبلیغ نیم‌صفحه عمودی یا افقی',
    placementId: 'place-mag-half',
    isActive: true,
  },
  {
    id: 'ad-3',
    type: 'print',
    name: 'ربع‌صفحه',
    size: 'A4 ربع‌صفحه',
    price: 5000000,
    description: 'مناسب برای آگهی‌های کوچک',
    placementId: 'place-mag-quarter',
    isActive: true,
  },
  {
    id: 'ad-4',
    type: 'digital',
    name: 'بنر اصلی',
    size: '728×90',
    price: 8000000,
    description: 'بنر بالای صفحه اصلی وب‌سایت — یک ماه',
    placementId: 'place-home-header',
    isActive: true,
  },
  {
    id: 'ad-5',
    type: 'digital',
    name: 'اسپانسر مقاله',
    size: 'درون متن',
    price: 6000000,
    description: 'اسپانسری یک مقاله ویژه',
    placementId: 'place-article-inline',
    isActive: true,
  },
  {
    id: 'ad-6',
    type: 'digital',
    name: 'خبرنامه',
    size: 'بنر ایمیل',
    price: 4000000,
    description: 'تبلیغ در خبرنامه هفتگی',
    placementId: 'place-nl-header',
    isActive: true,
  },
  {
    id: 'ad-7',
    type: 'digital',
    name: 'سایدبار صفحه اصلی',
    size: '300×600',
    price: 7000000,
    description: 'جایگاه سایدبار صفحه اصلی — یک ماه',
    placementId: 'place-home-sidebar-start',
    isActive: true,
  },
];

export const DEFAULT_AD_PLACEMENTS: AdPlacement[] = [
  {
    id: 'place-home-header',
    surface: 'website-home',
    slotKey: 'header-banner',
    label: 'بنر هدر صفحه اصلی',
    description: 'نوار افقی بالای صفحه اصلی سایت',
    sizeHint: '728×90',
    pricingId: 'ad-4',
    isActive: true,
  },
  {
    id: 'place-home-sidebar-start',
    surface: 'website-home',
    slotKey: 'sidebar-start',
    label: 'سایدبار راست',
    description: 'جایگاه عمودی کنار محتوای اصلی (سمت راست در چیدمان فارسی)',
    sizeHint: '300×600',
    pricingId: 'ad-7',
    isActive: true,
  },
  {
    id: 'place-home-mid',
    surface: 'website-home',
    slotKey: 'main-mid',
    label: 'میانه محتوا',
    description: 'بنر افقی در میان فهرست مطالب صفحه اصلی',
    sizeHint: '970×90',
    isActive: true,
  },
  {
    id: 'place-home-sidebar-end',
    surface: 'website-home',
    slotKey: 'sidebar-end',
    label: 'سایدبار چپ',
    description: 'جایگاه عمودی سمت چپ صفحه اصلی',
    sizeHint: '160×600',
    isActive: true,
  },
  {
    id: 'place-home-footer',
    surface: 'website-home',
    slotKey: 'footer-banner',
    label: 'بنر فوتر',
    description: 'نوار افقی پایین صفحه اصلی',
    sizeHint: '728×90',
    isActive: true,
  },
  {
    id: 'place-article-top',
    surface: 'website-article',
    slotKey: 'top-banner',
    label: 'بنر بالای مقاله',
    description: 'بالای تیتر یا ابتدای صفحه مقاله',
    sizeHint: '728×90',
    isActive: true,
  },
  {
    id: 'place-article-inline',
    surface: 'website-article',
    slotKey: 'in-article',
    label: 'درون متن مقاله',
    description: 'جایگاه اسپانسر بین پاراگراف‌های مقاله',
    sizeHint: 'درون‌متنی',
    pricingId: 'ad-5',
    isActive: true,
  },
  {
    id: 'place-article-sidebar',
    surface: 'website-article',
    slotKey: 'article-sidebar',
    label: 'سایدبار مقاله',
    description: 'ستون کناری صفحه مقاله',
    sizeHint: '300×250',
    isActive: true,
  },
  {
    id: 'place-mag-full',
    surface: 'magazine-print',
    slotKey: 'full-page',
    label: 'صفحه کامل ماهنامه',
    description: 'آگهی تمام‌صفحه در شماره چاپی',
    sizeHint: 'A4 تمام‌صفحه',
    pricingId: 'ad-1',
    isActive: true,
  },
  {
    id: 'place-mag-half',
    surface: 'magazine-print',
    slotKey: 'half-page',
    label: 'نیم‌صفحه ماهنامه',
    description: 'آگهی نیم‌صفحه افقی یا عمودی',
    sizeHint: 'A4 نیم‌صفحه',
    pricingId: 'ad-2',
    isActive: true,
  },
  {
    id: 'place-mag-quarter',
    surface: 'magazine-print',
    slotKey: 'quarter-page',
    label: 'ربع‌صفحه ماهنامه',
    description: 'آگهی کوچک ربع‌صفحه',
    sizeHint: 'A4 ربع‌صفحه',
    pricingId: 'ad-3',
    isActive: true,
  },
  {
    id: 'place-nl-header',
    surface: 'newsletter',
    slotKey: 'nl-header',
    label: 'بنر بالای خبرنامه',
    description: 'بنر ابتدای ایمیل خبرنامه هفتگی',
    sizeHint: '600×120',
    pricingId: 'ad-6',
    isActive: true,
  },
  {
    id: 'place-nl-mid',
    surface: 'newsletter',
    slotKey: 'nl-mid',
    label: 'میانه خبرنامه',
    description: 'جایگاه بین مطالب خبرنامه',
    sizeHint: '600×100',
    isActive: true,
  },
];

export const DEFAULT_AD_PORTFOLIO: AdPortfolio[] = [
  {
    id: 'port-1',
    title: 'کمپین بهار ۱۴۰۵',
    client: 'شرکت فناوری آلفا',
    image: '/images/mock/placeholder-ad.svg',
    type: 'digital',
    isActive: true,
  },
  {
    id: 'port-2',
    title: 'تبلیغ شماره ۱۰',
    client: 'بانک ملی',
    image: '/images/mock/placeholder-ad.svg',
    type: 'print',
    isActive: true,
  },
  {
    id: 'port-3',
    title: 'اسپانسری ویژه',
    client: 'استارتاپ بتا',
    image: '/images/mock/placeholder-ad.svg',
    type: 'digital',
    isActive: true,
  },
];

export const DEFAULT_JOB_OPENINGS: JobOpening[] = [
  {
    id: 'job-1',
    title: 'نویسنده تحلیلی — بخش اقتصاد',
    type: 'freelance',
    description: 'به نویسنده با سابقه تحلیل اقتصادی برای نگارش ۲ مقاله در ماه نیاز داریم.',
    deadline: '2026-09-30',
    isActive: true,
  },
  {
    id: 'job-2',
    title: 'طراح گرافیک',
    type: 'fulltime',
    description: 'طراح خلاق برای طراحی کاور شماره‌ها و اینفوگرافیک مقالات.',
    deadline: '2026-10-15',
    isActive: true,
  },
  {
    id: 'job-3',
    title: 'خبرنگار حوزه فناوری',
    type: 'freelance',
    description: 'پوشش اخبار و گزارش از رویدادهای فناوری.',
    deadline: '2026-09-20',
    isActive: true,
  },
];

export const DEFAULT_WRITING_GUIDELINES = [
  {
    id: 'guide-1',
    title: 'ساختار مقاله',
    content:
      'مقالات باید شامل مقدمه، بدنه (با زیرعنوان‌ها) و نتیجه‌گیری باشند. طول پیشنهادی: ۱۵۰۰ تا ۳۰۰۰ کلمه.',
  },
  {
    id: 'guide-2',
    title: 'سبک نگارش',
    content: 'از زبان رسمی-عامیانه استفاده کنید. جملات کوتاه و روان، پاراگراف‌های حداکثر ۵ خط.',
  },
  {
    id: 'guide-3',
    title: 'منابع',
    content: 'تمام ادعاها باید منبع داشته باشند. از لینک‌دهی و پاورقی استفاده کنید.',
  },
  {
    id: 'guide-4',
    title: 'تصاویر',
    content: 'تصاویر باید حقوق استفاده داشته باشند. رزولوشن حداقل 1200px عرض.',
  },
  {
    id: 'guide-5',
    title: 'فرمت ارسال',
    content: 'فایل Word یا Google Docs. فونت وزیرمتن، سایز ۱۴.',
  },
];

export const DEFAULT_COLLABORATION_TYPES = [
  {
    id: 'writer',
    label: 'نویسندگی / خبرنگاری',
    description: 'نگارش مقاله، گزارش و یادداشت',
    isActive: true,
  },
  {
    id: 'editor',
    label: 'ویراستاری',
    description: 'ویرایش ادبی و آماده‌سازی مطلب',
    isActive: true,
  },
  {
    id: 'designer',
    label: 'طراحی گرافیک',
    description: 'کاور، اینفوگرافیک و هویت بصری',
    isActive: true,
  },
  {
    id: 'photographer',
    label: 'عکاسی',
    description: 'عکاسی خبری و مستند',
    isActive: true,
  },
  {
    id: 'translator',
    label: 'ترجمه',
    description: 'ترجمه فارسی ↔ زبان‌های دیگر',
    isActive: true,
  },
  {
    id: 'other',
    label: 'سایر همکاری‌ها',
    description: 'پیشنهاد نقش یا همکاری دیگر',
    isActive: true,
  },
];

export const DEFAULT_SERVICES_CONTENT = {
  nav: DEFAULT_SERVICES_NAV,
  advertising: {
    title: 'تبلیغات و آگهی',
    description: 'فرصت‌های تبلیغاتی در ماهنامه چاپی و وب‌سایت — با پوشش مخاطب هدفمند',
    pricingTitle: 'تعرفه‌های تبلیغاتی',
    pricingSubtitle: 'چاپی و دیجیتال — قیمت‌ها به تومان',
    placementsTitle: 'جایگاه‌های تبلیغاتی',
    placementsSubtitle: 'نمای شماتیک جاگذاری آگهی در سایت، مقاله، ماهنامه و خبرنامه',
    formTitle: 'درخواست کمپین تبلیغاتی',
    formSubtitle: 'فرم را پر کنید تا در کوتاه‌ترین زمان با شما تماس بگیریم',
    portfolioTitle: 'نمونه‌کارها',
    portfolioSubtitle: 'برخی از همکاری‌های اخیر برندها',
    pricing: DEFAULT_AD_PRICING,
    placements: DEFAULT_AD_PLACEMENTS,
    portfolio: DEFAULT_AD_PORTFOLIO,
  },
  collaborate: {
    title: 'همکاری با ما',
    description: 'برای نویسندگان، فریلنسرها و علاقه‌مندان به همکاری با تیم تحریریه',
    formTitle: 'ارسال مقاله',
    formSubtitle: 'پیش‌نویس یا ایده خود را برای بررسی تحریریه ارسال کنید',
    resumeTitle: 'درخواست همکاری و ارسال رزومه',
    resumeSubtitle: 'نوع همکاری را انتخاب کنید و رزومه یا نمونه‌کار خود را بفرستید',
    jobsTitle: 'فراخوان همکاری',
    jobsSubtitle: 'فرصت‌های فریلنس و استخدام فعال',
    guidelinesTitle: 'راهنمای نگارش',
    guidelinesSubtitle: 'دستورالعمل سبک و ساختار برای نویسندگان',
    jobs: DEFAULT_JOB_OPENINGS,
    guidelines: DEFAULT_WRITING_GUIDELINES,
    collaborationTypes: DEFAULT_COLLABORATION_TYPES,
  },
};

export type ServicesContent = typeof DEFAULT_SERVICES_CONTENT;

function normalizeAdPricing(items: unknown): AdPricing[] {
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_AD_PRICING;
  return items.map((raw, index) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Partial<AdPricing>;
    return {
      id: typeof item.id === 'string' && item.id ? item.id : `ad-${index + 1}`,
      type: item.type === 'digital' ? 'digital' : 'print',
      name: typeof item.name === 'string' ? item.name : '',
      size: typeof item.size === 'string' ? item.size : '',
      price: typeof item.price === 'number' && item.price >= 0 ? item.price : 0,
      description: typeof item.description === 'string' ? item.description : '',
      placementId:
        typeof item.placementId === 'string' && item.placementId ? item.placementId : undefined,
      isActive: item.isActive !== false,
    };
  });
}

function normalizeAdPlacements(items: unknown): AdPlacement[] {
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_AD_PLACEMENTS;
  const normalized: AdPlacement[] = [];
  for (const [index, raw] of items.entries()) {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Partial<AdPlacement>;
    const surface =
      typeof item.surface === 'string' && isAdSurfaceId(item.surface) ? item.surface : null;
    if (!surface) continue;
    const slotKey = typeof item.slotKey === 'string' ? item.slotKey : '';
    if (!getSchematicSlot(surface, slotKey)) continue;
    normalized.push({
      id: typeof item.id === 'string' && item.id ? item.id : `place-${index + 1}`,
      surface,
      slotKey,
      label:
        typeof item.label === 'string'
          ? item.label
          : (getSchematicSlot(surface, slotKey)?.defaultLabel ?? ''),
      description: typeof item.description === 'string' ? item.description : '',
      sizeHint: typeof item.sizeHint === 'string' ? item.sizeHint : '',
      pricingId: typeof item.pricingId === 'string' && item.pricingId ? item.pricingId : undefined,
      isActive: item.isActive !== false,
    });
  }
  return normalized.length > 0 ? normalized : DEFAULT_AD_PLACEMENTS;
}

function normalizeAdPortfolio(items: unknown): AdPortfolio[] {
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_AD_PORTFOLIO;
  return items.map((raw, index) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Partial<AdPortfolio>;
    return {
      id: typeof item.id === 'string' && item.id ? item.id : `port-${index + 1}`,
      title: typeof item.title === 'string' ? item.title : '',
      client: typeof item.client === 'string' ? item.client : '',
      image:
        typeof item.image === 'string' && item.image
          ? item.image
          : '/images/mock/placeholder-ad.svg',
      type: item.type === 'print' ? 'print' : 'digital',
      isActive: item.isActive !== false,
    };
  });
}

export function mergeServicesContent(value: unknown): ServicesContent {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<ServicesContent>;
  return {
    nav: Array.isArray(input.nav) && input.nav.length > 0 ? input.nav : DEFAULT_SERVICES_NAV,
    advertising: {
      ...DEFAULT_SERVICES_CONTENT.advertising,
      ...(input.advertising ?? {}),
      pricing: normalizeAdPricing(input.advertising?.pricing),
      placements: normalizeAdPlacements(input.advertising?.placements),
      portfolio: normalizeAdPortfolio(input.advertising?.portfolio),
    },
    collaborate: {
      ...DEFAULT_SERVICES_CONTENT.collaborate,
      ...(input.collaborate ?? {}),
      jobs:
        Array.isArray(input.collaborate?.jobs) && input.collaborate.jobs.length > 0
          ? input.collaborate.jobs
          : DEFAULT_JOB_OPENINGS,
      guidelines:
        Array.isArray(input.collaborate?.guidelines) && input.collaborate.guidelines.length > 0
          ? input.collaborate.guidelines
          : DEFAULT_WRITING_GUIDELINES,
      collaborationTypes:
        Array.isArray(input.collaborate?.collaborationTypes) &&
        input.collaborate.collaborationTypes.length > 0
          ? input.collaborate.collaborationTypes
          : DEFAULT_COLLABORATION_TYPES,
    },
  };
}

export function getActiveAdPricing(pricing: AdPricing[]): AdPricing[] {
  return pricing.filter((p) => p.isActive !== false && p.price >= 0);
}

export function getActiveAdPlacements(placements: AdPlacement[]): AdPlacement[] {
  return placements.filter(
    (p) => p.isActive !== false && Boolean(getSchematicSlot(p.surface, p.slotKey)),
  );
}

export function getActivePortfolio(items: AdPortfolio[]): AdPortfolio[] {
  return items.filter((p) => p.isActive !== false);
}

export function getActiveJobs(jobs: JobOpening[]): JobOpening[] {
  return jobs.filter((j) => j.isActive !== false);
}

export function getActiveCollaborationTypes(
  types: ServicesContent['collaborate']['collaborationTypes'],
) {
  return types.filter((t) => t.isActive !== false);
}
