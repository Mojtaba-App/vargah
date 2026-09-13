import type {
  SiteBrandingSettings,
  SiteContactSettings,
  SiteFooterSettings,
  SiteNewsletterSettings,
} from '@vargah/business/site-settings';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSiteBranding(branding: SiteBrandingSettings): string | null {
  if (!branding.siteName.trim()) return 'نام سایت الزامی است.';
  return null;
}

export function validateSiteFooter(footer: SiteFooterSettings): string | null {
  if (footer.email.trim() && !EMAIL_RE.test(footer.email.trim())) {
    return 'ایمیل فوتر معتبر نیست.';
  }
  return null;
}

export function validateSiteContact(contact: SiteContactSettings): string | null {
  if (contact.email.trim() && !EMAIL_RE.test(contact.email.trim())) {
    return 'ایمیل تماس معتبر نیست.';
  }
  if (contact.mapLat < -90 || contact.mapLat > 90) return 'عرض جغرافیایی باید بین -90 و 90 باشد.';
  if (contact.mapLng < -180 || contact.mapLng > 180) return 'طول جغرافیایی باید بین -180 و 180 باشد.';
  return null;
}

export function validateSiteNewsletter(newsletter: SiteNewsletterSettings): string | null {
  if (!newsletter.title.trim()) return 'عنوان خبرنامه الزامی است.';
  if (!newsletter.ctaLabel.trim()) return 'متن دکمه عضویت الزامی است.';
  return null;
}
