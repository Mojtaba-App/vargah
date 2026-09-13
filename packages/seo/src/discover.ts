/** Google Discover — تصویر کاور با کیفیت بالا و نسبت ۱۶:۹ (حداقل ۱۲۰۰px عرض) */
export const DISCOVER_IMAGE_WIDTH = 1200;
export const DISCOVER_IMAGE_HEIGHT = 675;
export const DISCOVER_ASPECT_RATIO = '16/9' as const;

export function isDiscoverReadyImage(url?: string | null): boolean {
  return Boolean(url && url.length > 0);
}

export function pickDiscoverImage(coverImage?: string | null, ogImage?: string | null): string | undefined {
  return ogImage || coverImage || undefined;
}
