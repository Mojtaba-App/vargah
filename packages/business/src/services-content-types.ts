export type ServiceNavIcon = 'collaborate' | 'advertising' | 'subscription' | 'contact';

export type ServiceNavItem = {
  href: string;
  label: string;
  description: string;
  icon: ServiceNavIcon;
  featured?: boolean;
};

/** Surfaces that have a fixed schematic wireframe on the public ads page */
export const AD_SURFACE_IDS = [
  'website-home',
  'website-article',
  'magazine-print',
  'newsletter',
] as const;

export type AdSurfaceId = (typeof AD_SURFACE_IDS)[number];

export type AdSchematicSlotDef = {
  key: string;
  defaultLabel: string;
  /** Percentage of schematic canvas (0–100) */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type AdSurfaceMeta = {
  id: AdSurfaceId;
  label: string;
  description: string;
  /** Visual frame proportion hint for the wireframe */
  frame: 'site' | 'article' | 'print' | 'newsletter';
};

export const AD_SURFACE_META: AdSurfaceMeta[] = [
  {
    id: 'website-home',
    label: 'صفحه اصلی سایت',
    description: 'بنر هدر، سایدبارها و جایگاه‌های میانه و فوتر',
    frame: 'site',
  },
  {
    id: 'website-article',
    label: 'صفحه مقاله',
    description: 'بنر بالا، درون‌متن و سایدبار مقاله',
    frame: 'article',
  },
  {
    id: 'magazine-print',
    label: 'صفحه ماهنامه چاپی',
    description: 'جایگاه‌های تمام‌صفحه، نیم‌صفحه و ربع‌صفحه',
    frame: 'print',
  },
  {
    id: 'newsletter',
    label: 'خبرنامه',
    description: 'بنر بالای ایمیل و جایگاه میانی خبرنامه',
    frame: 'newsletter',
  },
];

/** Fixed geometry for public/admin schematic previews — do not reorder keys casually */
export const AD_SCHEMATIC_SLOTS: Record<AdSurfaceId, AdSchematicSlotDef[]> = {
  'website-home': [
    { key: 'header-banner', defaultLabel: 'بنر هدر', x: 6, y: 5, w: 88, h: 9 },
    { key: 'sidebar-start', defaultLabel: 'سایدبار (سمت راست)', x: 6, y: 18, w: 20, h: 58 },
    { key: 'main-mid', defaultLabel: 'میانه محتوا', x: 30, y: 38, w: 40, h: 14 },
    { key: 'sidebar-end', defaultLabel: 'سایدبار (سمت چپ)', x: 74, y: 18, w: 20, h: 58 },
    { key: 'footer-banner', defaultLabel: 'بنر فوتر', x: 6, y: 84, w: 88, h: 9 },
  ],
  'website-article': [
    { key: 'top-banner', defaultLabel: 'بنر بالای مقاله', x: 8, y: 6, w: 60, h: 8 },
    { key: 'in-article', defaultLabel: 'درون متن مقاله', x: 8, y: 42, w: 60, h: 12 },
    { key: 'article-sidebar', defaultLabel: 'سایدبار مقاله', x: 74, y: 18, w: 18, h: 55 },
  ],
  'magazine-print': [
    { key: 'full-page', defaultLabel: 'صفحه کامل', x: 10, y: 8, w: 80, h: 84 },
    { key: 'half-page', defaultLabel: 'نیم‌صفحه', x: 10, y: 8, w: 80, h: 42 },
    { key: 'quarter-page', defaultLabel: 'ربع‌صفحه', x: 10, y: 8, w: 38, h: 40 },
  ],
  newsletter: [
    { key: 'nl-header', defaultLabel: 'بنر بالای خبرنامه', x: 12, y: 8, w: 76, h: 12 },
    { key: 'nl-mid', defaultLabel: 'میانه خبرنامه', x: 12, y: 48, w: 76, h: 14 },
  ],
};

export type AdPricing = {
  id: string;
  type: 'print' | 'digital';
  name: string;
  size: string;
  price: number;
  description: string;
  /** Optional linked placement id for schematic + pricing cross-reference */
  placementId?: string;
  isActive?: boolean;
};

export type AdPlacement = {
  id: string;
  surface: AdSurfaceId;
  slotKey: string;
  label: string;
  description: string;
  sizeHint: string;
  pricingId?: string;
  isActive?: boolean;
};

export type AdPortfolio = {
  id: string;
  title: string;
  client: string;
  image: string;
  type: 'print' | 'digital';
  isActive?: boolean;
};

export type JobOpening = {
  id: string;
  title: string;
  type: 'freelance' | 'fulltime';
  description: string;
  deadline: string;
  isActive?: boolean;
};

export type WritingGuideline = {
  id: string;
  title: string;
  content: string;
};

export type CollaborationTypeOption = {
  id: string;
  label: string;
  description?: string;
  isActive?: boolean;
};

export function isAdSurfaceId(value: string): value is AdSurfaceId {
  return (AD_SURFACE_IDS as readonly string[]).includes(value);
}

export function getSchematicSlot(
  surface: AdSurfaceId,
  slotKey: string,
): AdSchematicSlotDef | undefined {
  return AD_SCHEMATIC_SLOTS[surface].find((slot) => slot.key === slotKey);
}

export function listSlotOptions(surface: AdSurfaceId): AdSchematicSlotDef[] {
  return AD_SCHEMATIC_SLOTS[surface];
}
