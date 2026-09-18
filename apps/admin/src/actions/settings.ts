'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma, AuditAction, type Prisma } from '@vargah/database';
import {
  DEFAULT_SITE_CONFIG,
  normalizeMapEmbedUrl,
  type SiteBrandingSettings,
  type SiteConfig,
  type SiteContactSettings,
  type SiteFooterSettings,
  type SiteNewsletterSettings,
} from '@vargah/business/site-settings';
import type { EmailConfig, MessagingConfig, SmsConfig } from '@vargah/business/messaging-config';
import type { PaymentConfig } from '@vargah/business/payment-config';
import type { MapConfig } from '@vargah/business/map-config';
import { getPaymentCallbackUrl, resolvePaymentConfig } from '@vargah/business/payment-config';
import { zarinpalTestConnection } from '@vargah/business/zarinpal';
import type { SubscriptionPlanConfig } from '@vargah/business/subscription-plans';

import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { revalidateWeb } from '@/lib/revalidate-web';
import { getSiteConfig, saveSiteConfig } from '@/lib/site-config';
import { getMessagingConfig, saveMessagingConfig } from '@/lib/messaging-config';
import { getPaymentConfig, savePaymentConfig } from '@/lib/payment-config';
import { getMapConfig, saveMapConfig } from '@/lib/map-config';
import {
  getSubscriptionPlansConfig,
  saveSubscriptionPlansConfig,
} from '@/lib/subscription-plans-config';
import { getServicesContent, saveServicesContent } from '@/lib/services-content';
import type { ServicesContent } from '@vargah/business/services-content';
import { getAboutContent, saveAboutContent } from '@/lib/about-content';
import type { AboutContent } from '@vargah/business/about-content';
import { testEmailConnection, sendEmail } from '@/lib/messaging/email';
import { testSmsConnection, sendSms } from '@/lib/messaging/sms';
import { getDatabaseConnectionInfo } from '@/lib/database-info';
import { SETTINGS_SECRET_PLACEHOLDER } from '@/lib/settings-secrets';
import { formatPaymentFeedbackMessage } from '@/lib/settings/errors';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import {
  emailConfigSchema,
  paymentConfigSchema,
  mapConfigSchema,
  siteBrandingSchema,
  siteContactSchema,
  siteFooterSchema,
  siteNewsletterSchema,
  smsConfigSchema,
  subscriptionPlansSchema,
} from '@vargah/security/schemas';

async function auditSettings(entityId: string, changes: Prisma.InputJsonValue) {
  const session = await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'SiteSetting',
    entityId,
    changes,
  });
}

function revalidateSettings() {
  revalidatePath('/settings');
  revalidateTag('site-config', 'max');
  revalidateTag('payment-config', 'max');
  revalidateTag('subscription-plans', 'max');
  void revalidateWeb({
    tags: [
      'site-config',
      'payment-config',
      'subscription-plans',
      'services-content',
      'about-content',
      'issues',
    ],
    paths: [
      '/fa',
      '/fa/about',
      '/fa/contact',
      '/fa/subscription',
      '/fa/issues',
      '/fa/advertising',
      '/fa/collaborate',
    ],
  });
}

export async function loadDatabaseConnectionInfo() {
  await requirePermission(PERMISSIONS.SETTINGS_VIEW);
  return getDatabaseConnectionInfo();
}

export async function testDatabaseConnection() {
  await requirePermission(PERMISSIONS.SETTINGS_VIEW);
  const info = getDatabaseConnectionInfo();
  const dbLabel = info.databaseName ? ` «${info.databaseName}»` : '';

  try {
    const started = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - started;
    const hostPart =
      info.host && info.port ? ` (${info.host}:${info.port})` : info.host ? ` (${info.host})` : '';
    return {
      ok: true as const,
      message: `اتصال به دیتابیس${dbLabel}${hostPart} برقرار است (${latencyMs}ms)`,
      databaseName: info.databaseName,
    };
  } catch {
    return {
      ok: false as const,
      message: info.databaseName
        ? `اتصال به دیتابیس «${info.databaseName}» برقرار نشد. DATABASE_URL را بررسی کنید.`
        : 'اتصال به دیتابیس برقرار نشد. DATABASE_URL را بررسی کنید.',
      databaseName: info.databaseName,
    };
  }
}

export async function loadSiteSettings() {
  await requirePermission(PERMISSIONS.SETTINGS_VIEW);
  return getSiteConfig();
}

export async function updateSiteBranding(branding: SiteBrandingSettings) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const validated = siteBrandingSchema.parse(branding);
  const current = await getSiteConfig();
  const config: SiteConfig = { ...current, branding: validated };
  await saveSiteConfig(config);
  await auditSettings('site_config', { section: 'branding' });
  revalidateSettings();
  return { success: true as const };
}

export async function updateSiteFooter(footer: SiteFooterSettings) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const validated = siteFooterSchema.parse(footer);
  const current = await getSiteConfig();
  const config: SiteConfig = { ...current, footer: validated };
  await saveSiteConfig(config);
  await auditSettings('site_config', { section: 'footer' });
  revalidateSettings();
  return { success: true as const };
}

export async function updateSiteContact(contact: SiteContactSettings) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const validated = siteContactSchema.parse(contact);
  const current = await getSiteConfig();
  const normalized: SiteContactSettings = {
    ...validated,
    mapEmbedUrl: normalizeMapEmbedUrl(validated.mapEmbedUrl),
    mapLat: Number(validated.mapLat) || DEFAULT_SITE_CONFIG.contact.mapLat,
    mapLng: Number(validated.mapLng) || DEFAULT_SITE_CONFIG.contact.mapLng,
    social: {
      instagram: validated.social.instagram.trim(),
      telegram: validated.social.telegram.trim(),
      whatsapp: validated.social.whatsapp.trim(),
      twitter: validated.social.twitter.trim(),
      eitaa: validated.social.eitaa.trim(),
      linkedin: validated.social.linkedin.trim(),
    },
  };
  const config: SiteConfig = { ...current, contact: normalized };
  await saveSiteConfig(config);
  await auditSettings('site_config', { section: 'contact' });
  revalidateSettings();
  return { success: true as const };
}

export async function updateSiteNewsletter(newsletter: SiteNewsletterSettings) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const validated = siteNewsletterSchema.parse(newsletter);
  const current = await getSiteConfig();
  const config: SiteConfig = { ...current, newsletter: validated };
  await saveSiteConfig(config);
  await auditSettings('site_config', { section: 'newsletter' });
  revalidateSettings();
  return { success: true as const };
}

export async function updateBrandingAsset(field: keyof SiteBrandingSettings, path: string) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getSiteConfig();
  const branding = { ...current.branding, [field]: path };
  await saveSiteConfig({ ...current, branding });
  await auditSettings('site_config', { section: 'branding', field, path });
  revalidateSettings();
  return { success: true as const };
}

/** @deprecated Use section-specific actions */
export async function updateSiteSettings(config: SiteConfig) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  await saveSiteConfig(config);
  await auditSettings('site_config', { sections: ['branding', 'footer'] });
  revalidateSettings();
  return { success: true as const };
}

export async function loadMessagingSettings() {
  await requirePermission(PERMISSIONS.SETTINGS_VIEW);
  const { toClientMessagingConfig } = await import('@/lib/settings/client-secrets');
  return toClientMessagingConfig(await getMessagingConfig());
}

function mergeEmailConfig(current: EmailConfig, incoming: EmailConfig): EmailConfig {
  return {
    ...current,
    ...incoming,
    password:
      incoming.password === SETTINGS_SECRET_PLACEHOLDER ? current.password : incoming.password,
  };
}

function mergeSmsConfig(current: SmsConfig, incoming: SmsConfig): SmsConfig {
  return {
    ...current,
    ...incoming,
    apiKey: incoming.apiKey === SETTINGS_SECRET_PLACEHOLDER ? current.apiKey : incoming.apiKey,
    password:
      incoming.password === SETTINGS_SECRET_PLACEHOLDER ? current.password : incoming.password,
  };
}

export async function updateEmailConfig(email: EmailConfig) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getMessagingConfig();
  const merged = mergeEmailConfig(current.email, emailConfigSchema.parse(email));
  await saveMessagingConfig({ ...current, email: merged });
  await auditSettings('messaging_config', { section: 'email' });
  revalidateSettings();
  return { success: true as const };
}

export async function updateSmsConfig(sms: SmsConfig) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getMessagingConfig();
  const merged = mergeSmsConfig(current.sms, smsConfigSchema.parse(sms));
  await saveMessagingConfig({ ...current, sms: merged });
  await auditSettings('messaging_config', { section: 'sms' });
  revalidateSettings();
  return { success: true as const };
}

export async function testEmailSettings(email: EmailConfig) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getMessagingConfig();
  const merged = mergeEmailConfig(current.email, emailConfigSchema.parse(email));
  try {
    const result = await testEmailConnection(merged);
    return { ok: true as const, message: result.message };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تست ایمیل ناموفق بود';
    return { ok: false as const, message };
  }
}

export async function testSmsSettings(sms: SmsConfig) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getMessagingConfig();
  const merged = mergeSmsConfig(current.sms, smsConfigSchema.parse(sms));
  try {
    const result = await testSmsConnection(merged);
    return { ok: true as const, message: result.message };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تست پیامک ناموفق بود';
    return { ok: false as const, message };
  }
}

export async function sendTestEmail(email: EmailConfig, to: string) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getMessagingConfig();
  const merged = mergeEmailConfig(current.email, emailConfigSchema.parse(email));
  try {
    await sendEmail({
      config: merged,
      to,
      subject: 'تست ایمیل — وارگه',
      text: 'این یک ایمیل آزمایشی از پنل مدیریت وارگه است.',
    });
    return { ok: true as const, message: 'ایمیل آزمایشی ارسال شد' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ارسال ایمیل آزمایشی ناموفق بود';
    return { ok: false as const, message };
  }
}

export async function sendTestSms(sms: SmsConfig, to: string) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getMessagingConfig();
  const merged = mergeSmsConfig(current.sms, smsConfigSchema.parse(sms));
  try {
    await sendSms({
      config: merged,
      to,
      message: 'پیام آزمایشی از پنل مدیریت وارگه',
    });
    return { ok: true as const, message: 'پیامک آزمایشی ارسال شد' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ارسال پیامک آزمایشی ناموفق بود';
    return { ok: false as const, message };
  }
}

export async function loadPaymentSettings() {
  await requirePermission(PERMISSIONS.SETTINGS_VIEW);
  const { toClientPaymentConfig } = await import('@/lib/settings/client-secrets');
  return toClientPaymentConfig(await getPaymentConfig());
}

function mergePaymentSecrets(current: PaymentConfig, incoming: PaymentConfig): PaymentConfig {
  return {
    ...current,
    ...incoming,
    zarinpal: {
      ...current.zarinpal,
      ...incoming.zarinpal,
      merchantId:
        incoming.zarinpal.merchantId === SETTINGS_SECRET_PLACEHOLDER
          ? current.zarinpal.merchantId
          : incoming.zarinpal.merchantId,
    },
  };
}

export async function updatePaymentConfig(config: PaymentConfig) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getPaymentConfig();
  const validated = paymentConfigSchema.parse(config);
  const merged = mergePaymentSecrets(current, validated);
  await savePaymentConfig(merged);
  await auditSettings('payment_config', { section: 'zarinpal', enabled: merged.enabled });
  revalidateSettings();
  return { success: true as const };
}

export async function testPaymentSettings(config: PaymentConfig) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getPaymentConfig();
  const validated = paymentConfigSchema.parse(config);
  const merged = mergePaymentSecrets(current, validated);
  const resolved = resolvePaymentConfig(merged);

  if (!resolved.zarinpal.merchantId) {
    return { ok: false as const, message: 'Merchant ID الزامی است' };
  }

  try {
    const message = await zarinpalTestConnection({
      merchantId: resolved.zarinpal.merchantId,
      sandbox: resolved.zarinpal.sandbox,
      callbackUrl: getPaymentCallbackUrl(resolved),
    });
    return { ok: true as const, message };
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'تست اتصال زرین‌پال ناموفق بود';
    return { ok: false as const, message: formatPaymentFeedbackMessage(raw) };
  }
}

export async function loadSubscriptionPlansSettings() {
  await requirePermission(PERMISSIONS.PLAN_VIEW);
  return getSubscriptionPlansConfig();
}

export async function updateSubscriptionPlans(plans: SubscriptionPlanConfig[]) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.PLAN_MANAGE);
  const validated = subscriptionPlansSchema.parse(plans);
  await saveSubscriptionPlansConfig(validated);
  await auditSettings('subscription_plans', { count: validated.length });
  revalidateSettings();
  return { success: true as const };
}

export async function loadServicesContentSettings() {
  await requirePermission(PERMISSIONS.SETTINGS_VIEW);
  return getServicesContent();
}

export async function updateServicesContent(content: ServicesContent) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  await saveServicesContent(content);
  await auditSettings('services_content', { sections: ['nav', 'advertising', 'collaborate'] });
  revalidateSettings();
  return { success: true as const };
}

export type ServicesContentSection =
  | 'nav'
  | 'advertising'
  | 'adPricing'
  | 'adPlacements'
  | 'adPortfolio'
  | 'collaborateMeta'
  | 'collaborationTypes'
  | 'jobs'
  | 'guidelines';

export async function updateServicesContentSection(
  section: ServicesContentSection,
  payload: unknown,
) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getServicesContent();
  let next: ServicesContent = current;

  switch (section) {
    case 'nav':
      next = { ...current, nav: payload as ServicesContent['nav'] };
      break;
    case 'advertising': {
      const meta = payload as Partial<ServicesContent['advertising']>;
      next = {
        ...current,
        advertising: {
          ...current.advertising,
          title: meta.title ?? current.advertising.title,
          description: meta.description ?? current.advertising.description,
          pricingTitle: meta.pricingTitle ?? current.advertising.pricingTitle,
          pricingSubtitle: meta.pricingSubtitle ?? current.advertising.pricingSubtitle,
          placementsTitle: meta.placementsTitle ?? current.advertising.placementsTitle,
          placementsSubtitle: meta.placementsSubtitle ?? current.advertising.placementsSubtitle,
          formTitle: meta.formTitle ?? current.advertising.formTitle,
          formSubtitle: meta.formSubtitle ?? current.advertising.formSubtitle,
          portfolioTitle: meta.portfolioTitle ?? current.advertising.portfolioTitle,
          portfolioSubtitle: meta.portfolioSubtitle ?? current.advertising.portfolioSubtitle,
          pricing: current.advertising.pricing,
          placements: current.advertising.placements,
          portfolio: current.advertising.portfolio,
        },
      };
      break;
    }
    case 'adPricing': {
      const pricing = payload as ServicesContent['advertising']['pricing'];
      const placements = current.advertising.placements.map((placement) => {
        const linked = pricing.find((p) => p.placementId === placement.id);
        if (linked) {
          return { ...placement, pricingId: linked.id };
        }
        if (placement.pricingId && !pricing.some((p) => p.id === placement.pricingId)) {
          return { ...placement, pricingId: undefined };
        }
        // Clear stale reverse link when tariff moved to another placement
        const stillPointsHere = pricing.some(
          (p) => p.id === placement.pricingId && p.placementId === placement.id,
        );
        if (placement.pricingId && !stillPointsHere) {
          const tariff = pricing.find((p) => p.id === placement.pricingId);
          if (tariff && tariff.placementId && tariff.placementId !== placement.id) {
            return { ...placement, pricingId: undefined };
          }
        }
        return placement;
      });
      next = {
        ...current,
        advertising: {
          ...current.advertising,
          pricing,
          placements,
        },
      };
      break;
    }
    case 'adPlacements': {
      const placements = payload as ServicesContent['advertising']['placements'];
      const pricing = current.advertising.pricing.map((tariff) => {
        const linked = placements.find((p) => p.pricingId === tariff.id);
        if (linked) {
          return { ...tariff, placementId: linked.id };
        }
        if (tariff.placementId && !placements.some((p) => p.id === tariff.placementId)) {
          return { ...tariff, placementId: undefined };
        }
        const stillPointsHere = placements.some(
          (p) => p.id === tariff.placementId && p.pricingId === tariff.id,
        );
        if (tariff.placementId && !stillPointsHere) {
          const placement = placements.find((p) => p.id === tariff.placementId);
          if (placement && placement.pricingId && placement.pricingId !== tariff.id) {
            return { ...tariff, placementId: undefined };
          }
        }
        return tariff;
      });
      next = {
        ...current,
        advertising: {
          ...current.advertising,
          placements,
          pricing,
        },
      };
      break;
    }
    case 'adPortfolio':
      next = {
        ...current,
        advertising: {
          ...current.advertising,
          portfolio: payload as ServicesContent['advertising']['portfolio'],
        },
      };
      break;
    case 'collaborateMeta': {
      const meta = payload as Partial<ServicesContent['collaborate']>;
      next = {
        ...current,
        collaborate: {
          ...current.collaborate,
          title: meta.title ?? current.collaborate.title,
          description: meta.description ?? current.collaborate.description,
          formTitle: meta.formTitle ?? current.collaborate.formTitle,
          formSubtitle: meta.formSubtitle ?? current.collaborate.formSubtitle,
          resumeTitle: meta.resumeTitle ?? current.collaborate.resumeTitle,
          resumeSubtitle: meta.resumeSubtitle ?? current.collaborate.resumeSubtitle,
          jobsTitle: meta.jobsTitle ?? current.collaborate.jobsTitle,
          jobsSubtitle: meta.jobsSubtitle ?? current.collaborate.jobsSubtitle,
          guidelinesTitle: meta.guidelinesTitle ?? current.collaborate.guidelinesTitle,
          guidelinesSubtitle: meta.guidelinesSubtitle ?? current.collaborate.guidelinesSubtitle,
        },
      };
      break;
    }
    case 'collaborationTypes':
      next = {
        ...current,
        collaborate: {
          ...current.collaborate,
          collaborationTypes: payload as ServicesContent['collaborate']['collaborationTypes'],
        },
      };
      break;
    case 'jobs':
      next = {
        ...current,
        collaborate: {
          ...current.collaborate,
          jobs: payload as ServicesContent['collaborate']['jobs'],
        },
      };
      break;
    case 'guidelines':
      next = {
        ...current,
        collaborate: {
          ...current.collaborate,
          guidelines: payload as ServicesContent['collaborate']['guidelines'],
        },
      };
      break;
    default:
      throw new Error('بخش نامعتبر است');
  }

  await saveServicesContent(next);
  await auditSettings('services_content', { section });
  revalidateSettings();
  return { success: true as const, section };
}

export async function loadAboutContentSettings() {
  await requirePermission(PERMISSIONS.SETTINGS_VIEW);
  return getAboutContent();
}

export async function updateAboutContent(content: AboutContent) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  await saveAboutContent(content);
  await auditSettings('about_content', {
    sections: ['page', 'intro', 'stats', 'mission', 'history', 'team', 'ethics'],
  });
  revalidateSettings();
  return { success: true as const };
}

export type AboutContentSection =
  'page' | 'intro' | 'stats' | 'mission' | 'history' | 'milestones' | 'team' | 'ethics' | 'cta';

export async function updateAboutContentSection(
  section: AboutContentSection,
  payload: AboutContent[AboutContentSection],
) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getAboutContent();
  const next: AboutContent = { ...current, [section]: payload };
  await saveAboutContent(next);
  await auditSettings('about_content', { section });
  revalidateSettings();
  return { success: true as const, section };
}

export async function loadMapSettings() {
  await requirePermission(PERMISSIONS.SETTINGS_VIEW);
  return getMapConfig();
}

function mergeMapSecrets(current: MapConfig, incoming: MapConfig): MapConfig {
  return {
    ...current,
    ...incoming,
    googleApiKey:
      incoming.googleApiKey === SETTINGS_SECRET_PLACEHOLDER
        ? current.googleApiKey
        : incoming.googleApiKey,
  };
}

export async function updateMapConfig(config: MapConfig) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const current = await getMapConfig();
  const validated = mapConfigSchema.parse(config);
  const merged = mergeMapSecrets(current, validated);
  await saveMapConfig(merged);
  await auditSettings('map_config', {
    googleEnabled: merged.googleEnabled,
    defaultBasemap: merged.defaultBasemap,
    customLayers: merged.customLayers.length,
  });
  revalidatePath('/settings');
  revalidatePath('/geo');
  return { success: true as const };
}
