export type SiteBrandingSettings = {
  siteName: string;
  siteTagline: string;
  siteLogo: string;
  favicon: string;
  adminLogo: string;
  loginLogo: string;
  loginBackground: string;
  heroBanner: string;
};

export type SiteFooterSettings = {
  description: string;
  copyright: string;
  email: string;
  phone: string;
  address: string;
};

export type SiteSocialLinks = {
  instagram: string;
  telegram: string;
  whatsapp: string;
  twitter: string;
  eitaa: string;
  linkedin: string;
};

export type SiteContactSettings = {
  address: string;
  phone: string;
  email: string;
  /** کد embed اختیاری OpenStreetMap (آدرس src یا تگ iframe) */
  mapEmbedUrl: string;
  mapLat: number;
  mapLng: number;
  pageEyebrow: string;
  pageTitle: string;
  pageDescription: string;
  formTitle: string;
  formSubtitle: string;
  infoTitle: string;
  socialTitle: string;
  mapTitle: string;
  workingHours: string;
  responseNote: string;
  social: SiteSocialLinks;
};

export type SiteNewsletterSettings = {
  eyebrow: string;
  title: string;
  description: string;
  emailLabel: string;
  placeholder: string;
  ctaLabel: string;
  successMessage: string;
  privacyNote: string;
};

export type SiteConfig = {
  branding: SiteBrandingSettings;
  footer: SiteFooterSettings;
  contact: SiteContactSettings;
  newsletter: SiteNewsletterSettings;
};

export const SITE_CONFIG_KEY = 'site_config';

export const DEFAULT_SITE_SOCIAL: SiteSocialLinks = {
  whatsapp: 'https://wa.me/989121234567',
  telegram: 'https://t.me/magazine',
  eitaa: 'https://eitaa.com/magazine',
  instagram: 'https://instagram.com/magazine',
  twitter: 'https://twitter.com/magazine',
  linkedin: '',
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  branding: {
    siteName: 'وارگه',
    siteTagline: 'ماهنامه مستقل فارسی‌زبان',
    siteLogo: '/images/vargah-logo.svg',
    favicon: '/favicon.ico',
    adminLogo: '/images/vargah-logo.svg',
    loginLogo: '/images/vargah-logo.svg',
    loginBackground: '/images/login-landscape.svg',
    heroBanner: '/images/hero-vargah.jpg',
  },
  footer: {
    description:
      'ماهنامه مستقل برای تحلیل، گزارش و نگاه عمیق به زندگی، فرهنگ و جامعه — با تمرکز بر مخاطب فارسی‌زبان.',
    copyright: 'ماهنامه وارگه. تمامی حقوق محفوظ است.',
    email: 'info@magazine.ir',
    phone: '021-12345678',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳۴',
  },
  contact: {
    address: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۳۴، واحد ۵',
    phone: '021-12345678',
    email: 'info@magazine.ir',
    mapEmbedUrl: '',
    mapLat: 35.7575,
    mapLng: 51.41,
    pageEyebrow: 'ارتباط با تحریریه',
    pageTitle: 'تماس با ما',
    pageDescription: 'فرم تماس، آدرس دفتر و شبکه‌های اجتماعی ماهنامه وارگه',
    formTitle: 'پیام بفرستید',
    formSubtitle: 'پیشنهاد، انتقاد یا پرسش خود را بنویسید — در کوتاه‌ترین زمان پاسخ می‌دهیم.',
    infoTitle: 'اطلاعات دفتر',
    socialTitle: 'شبکه‌های اجتماعی',
    mapTitle: 'موقعیت دفتر',
    workingHours: 'شنبه تا چهارشنبه، ۹ تا ۱۷',
    responseNote: 'معمولاً ظرف یک تا دو روز کاری پاسخ می‌دهیم.',
    social: DEFAULT_SITE_SOCIAL,
  },
  newsletter: {
    eyebrow: 'خبرنامه',
    title: 'عضویت در خبرنامه',
    description:
      'از انتشار شماره جدید، مطالب ویژه و رویدادهای ماهنامه باخبر شوید — بدون اسپم.',
    emailLabel: 'ایمیل شما',
    placeholder: 'name@example.com',
    ctaLabel: 'عضویت',
    successMessage: 'با موفقیت ثبت شد! به‌زودی از تازه‌ها باخبر می‌شوید.',
    privacyNote: 'با ثبت‌نام، اعلام شماره‌ها و مطالب ویژه را دریافت می‌کنید و هر زمان از صفحه لغو عضویت قابل توقف است.',
  },
};

const LEGACY_BROKEN_LOGO = '/images/vargah-logo.png';
const LEGACY_BROKEN_BACKGROUND = '/images/login-landscape.webp';

function normalizeBrandingDefaults(branding: Partial<SiteBrandingSettings>): SiteBrandingSettings {
  const merged = { ...DEFAULT_SITE_CONFIG.branding, ...branding };
  if (merged.loginLogo.split('?')[0] === LEGACY_BROKEN_LOGO) {
    merged.loginLogo = DEFAULT_SITE_CONFIG.branding.loginLogo;
  }
  if (merged.adminLogo.split('?')[0] === LEGACY_BROKEN_LOGO) {
    merged.adminLogo = DEFAULT_SITE_CONFIG.branding.adminLogo;
  }
  if (merged.siteLogo.split('?')[0] === LEGACY_BROKEN_LOGO) {
    merged.siteLogo = DEFAULT_SITE_CONFIG.branding.siteLogo;
  }
  if (merged.loginBackground.split('?')[0] === LEGACY_BROKEN_BACKGROUND) {
    merged.loginBackground = DEFAULT_SITE_CONFIG.branding.loginBackground;
  }
  return merged;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function mergeSiteSocial(value: unknown): SiteSocialLinks {
  const input = asRecord(value);
  return {
    instagram: typeof input.instagram === 'string' ? input.instagram.trim() : DEFAULT_SITE_SOCIAL.instagram,
    telegram: typeof input.telegram === 'string' ? input.telegram.trim() : DEFAULT_SITE_SOCIAL.telegram,
    whatsapp: typeof input.whatsapp === 'string' ? input.whatsapp.trim() : DEFAULT_SITE_SOCIAL.whatsapp,
    twitter: typeof input.twitter === 'string' ? input.twitter.trim() : DEFAULT_SITE_SOCIAL.twitter,
    eitaa: typeof input.eitaa === 'string' ? input.eitaa.trim() : DEFAULT_SITE_SOCIAL.eitaa,
    linkedin: typeof input.linkedin === 'string' ? input.linkedin.trim() : DEFAULT_SITE_SOCIAL.linkedin,
  };
}

/** فقط لینک‌های معتبر برای نمایش عمومی */
export function getActiveSocialLinks(social: SiteSocialLinks): Partial<SiteSocialLinks> {
  const result: Partial<SiteSocialLinks> = {};
  for (const key of Object.keys(social) as Array<keyof SiteSocialLinks>) {
    const value = social[key]?.trim();
    if (value && value !== '#') result[key] = value;
  }
  return result;
}

export function mergeSiteContact(value: unknown): SiteContactSettings {
  const input = asRecord(value);
  const defaults = DEFAULT_SITE_CONFIG.contact;
  return {
    address: typeof input.address === 'string' ? input.address : defaults.address,
    phone: typeof input.phone === 'string' ? input.phone : defaults.phone,
    email: typeof input.email === 'string' ? input.email : defaults.email,
    mapEmbedUrl: typeof input.mapEmbedUrl === 'string' ? input.mapEmbedUrl : defaults.mapEmbedUrl,
    mapLat: typeof input.mapLat === 'number' && Number.isFinite(input.mapLat) ? input.mapLat : defaults.mapLat,
    mapLng: typeof input.mapLng === 'number' && Number.isFinite(input.mapLng) ? input.mapLng : defaults.mapLng,
    pageEyebrow: typeof input.pageEyebrow === 'string' ? input.pageEyebrow : defaults.pageEyebrow,
    pageTitle: typeof input.pageTitle === 'string' ? input.pageTitle : defaults.pageTitle,
    pageDescription:
      typeof input.pageDescription === 'string' ? input.pageDescription : defaults.pageDescription,
    formTitle: typeof input.formTitle === 'string' ? input.formTitle : defaults.formTitle,
    formSubtitle: typeof input.formSubtitle === 'string' ? input.formSubtitle : defaults.formSubtitle,
    infoTitle: typeof input.infoTitle === 'string' ? input.infoTitle : defaults.infoTitle,
    socialTitle: typeof input.socialTitle === 'string' ? input.socialTitle : defaults.socialTitle,
    mapTitle: typeof input.mapTitle === 'string' ? input.mapTitle : defaults.mapTitle,
    workingHours: typeof input.workingHours === 'string' ? input.workingHours : defaults.workingHours,
    responseNote: typeof input.responseNote === 'string' ? input.responseNote : defaults.responseNote,
    social: mergeSiteSocial(input.social),
  };
}

export function mergeSiteNewsletter(value: unknown): SiteNewsletterSettings {
  const input = asRecord(value);
  const defaults = DEFAULT_SITE_CONFIG.newsletter;
  return {
    eyebrow: typeof input.eyebrow === 'string' ? input.eyebrow : defaults.eyebrow,
    title: typeof input.title === 'string' ? input.title : defaults.title,
    description: typeof input.description === 'string' ? input.description : defaults.description,
    emailLabel: typeof input.emailLabel === 'string' ? input.emailLabel : defaults.emailLabel,
    placeholder: typeof input.placeholder === 'string' ? input.placeholder : defaults.placeholder,
    ctaLabel: typeof input.ctaLabel === 'string' ? input.ctaLabel : defaults.ctaLabel,
    successMessage:
      typeof input.successMessage === 'string' ? input.successMessage : defaults.successMessage,
    privacyNote: typeof input.privacyNote === 'string' ? input.privacyNote : defaults.privacyNote,
  };
}

export function mergeSiteConfig(value: unknown): SiteConfig {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<SiteConfig>;

  return {
    branding: normalizeBrandingDefaults(input.branding ?? {}),
    footer: { ...DEFAULT_SITE_CONFIG.footer, ...input.footer },
    contact: mergeSiteContact(input.contact),
    newsletter: mergeSiteNewsletter(input.newsletter),
  };
}

export type ContactMapView =
  | { mode: 'embed'; src: string }
  | { mode: 'coordinates'; lat: number; lng: number };

/** ساخت URL embed استاندارد OpenStreetMap از مختصات */
export function buildOpenStreetMapEmbedUrl(lat: number, lng: number, delta = 0.015): string {
  const west = lng - delta;
  const south = lat - delta;
  const east = lng + delta;
  const north = lat + delta;
  const bbox = `${west}%2C${south}%2C${east}%2C${north}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

/** تعیین نحوه نمایش نقشه تماس با ما */
export function resolveContactMapView(
  contact: Pick<SiteContactSettings, 'mapEmbedUrl' | 'mapLat' | 'mapLng'>,
): ContactMapView | null {
  const embed = normalizeMapEmbedUrl(contact.mapEmbedUrl);
  if (embed) return { mode: 'embed', src: embed };

  const lat = Number(contact.mapLat);
  const lng = Number(contact.mapLng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { mode: 'coordinates', lat, lng };
}

/** @deprecated use resolveContactMapView */
export function resolveContactMapUrl(
  contact: Pick<SiteContactSettings, 'mapEmbedUrl' | 'mapLat' | 'mapLng'>,
): string | null {
  const view = resolveContactMapView(contact);
  if (!view) return null;
  if (view.mode === 'embed') return view.src;
  return buildOpenStreetMapEmbedUrl(view.lat, view.lng);
}

/** لینک باز کردن موقعیت در OpenStreetMap */
export function buildOpenStreetMapLink(lat: number, lng: number, zoom = 17): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}

/** لینک نشان (مسیریابی / مشاهده نقطه) */
export function buildNeshanLink(lat: number, lng: number): string {
  return `https://neshan.org/maps/@${lat},${lng},17.0z,0.0t/routing/car/origin/${lat},${lng}`;
}

/** لینک بلد */
export function buildBaladLink(lat: number, lng: number): string {
  return `https://balad.ir/location?latitude=${lat}&longitude=${lng}&zoom=17`;
}

/** دامنه‌های مجاز embed نقشه */
const ALLOWED_MAP_EMBED_HOSTS = new Set([
  'www.openstreetmap.org',
  'openstreetmap.org',
  'www.google.com',
  'google.com',
  'maps.google.com',
  'maps.neshan.org',
  'neshan.org',
  'www.neshan.org',
  'balad.ir',
  'www.balad.ir',
]);

function isAllowedMapEmbedUrl(url: URL): boolean {
  return ALLOWED_MAP_EMBED_HOSTS.has(url.hostname);
}

/** استخراج و اعتبارسنجی آدرس embed نقشه از URL یا تگ iframe */
export function normalizeMapEmbedUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const candidate = iframeMatch?.[1] ?? trimmed;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    if (!isAllowedMapEmbedUrl(parsed)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}
