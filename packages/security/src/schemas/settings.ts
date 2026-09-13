import { z } from 'zod';

export const siteBrandingSchema = z.object({
  siteName: z.string().min(1).max(120),
  siteTagline: z.string().max(200),
  siteLogo: z.string().max(500),
  favicon: z.string().max(500),
  adminLogo: z.string().max(500),
  loginLogo: z.string().max(500),
  loginBackground: z.string().max(500),
  heroBanner: z.string().max(500),
});

export const siteFooterSchema = z.object({
  description: z.string().max(2000),
  copyright: z.string().max(300),
  email: z.string().email().max(255).or(z.literal('')),
  phone: z.string().max(40),
  address: z.string().max(500),
});

export const siteContactSchema = z.object({
  address: z.string().max(500),
  phone: z.string().max(40),
  email: z.string().email().max(255).or(z.literal('')),
  mapEmbedUrl: z.string().max(4000),
  mapLat: z.number().min(-90).max(90),
  mapLng: z.number().min(-180).max(180),
  pageEyebrow: z.string().max(80),
  pageTitle: z.string().min(1).max(120),
  pageDescription: z.string().max(500),
  formTitle: z.string().max(120),
  formSubtitle: z.string().max(400),
  infoTitle: z.string().max(120),
  socialTitle: z.string().max(120),
  mapTitle: z.string().max(120),
  workingHours: z.string().max(200),
  responseNote: z.string().max(300),
  social: z.object({
    instagram: z.string().max(500),
    telegram: z.string().max(500),
    whatsapp: z.string().max(500),
    twitter: z.string().max(500),
    eitaa: z.string().max(500),
    linkedin: z.string().max(500),
  }),
});

export const siteNewsletterSchema = z.object({
  eyebrow: z.string().max(80),
  title: z.string().min(1).max(120),
  description: z.string().max(500),
  emailLabel: z.string().max(80),
  placeholder: z.string().max(120),
  ctaLabel: z.string().min(1).max(60),
  successMessage: z.string().max(300),
  privacyNote: z.string().max(300),
});

export const emailConfigSchema = z.object({
  enabled: z.boolean(),
  host: z.string().max(255),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().max(255),
  password: z.string().max(512),
  fromName: z.string().max(120),
  fromEmail: z.string().email().max(255).or(z.literal('')),
});

export const smsConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['kavenegar', 'melipayamak', 'sms_ir']),
  apiKey: z.string().max(512),
  username: z.string().max(120),
  password: z.string().max(512),
  lineNumber: z.string().max(40),
  sender: z.string().max(40),
});

export const webhookSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url().max(2000),
  provider: z.enum(['TELEGRAM', 'EITAA', 'BALE', 'SLACK', 'DISCORD', 'GENERIC']),
  secret: z.string().max(500).optional(),
  events: z.array(z.string().min(1).max(80)).max(50),
});

export const satisfactionSurveySchema = z.object({
  ticketId: z.string().cuid(),
  score: z.number().int().min(0).max(10),
  comment: z.string().max(2000).optional(),
});

export const messageTemplateSchema = z.object({
  key: z.string().min(2).max(80).regex(/^[a-z0-9._-]+$/i),
  name: z.string().min(1).max(120),
  channel: z.enum(['EMAIL', 'SMS', 'WEBHOOK']),
  subject: z.string().max(300).optional(),
  body: z.string().min(1).max(10000),
  externalTemplateId: z.string().max(120).optional(),
  variables: z.array(z.string().max(40)).max(20).optional(),
});

export const paymentConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.literal('zarinpal'),
  zarinpal: z.object({
    merchantId: z
      .string()
      .max(36, 'شناسه پذیرنده (Merchant ID) نباید بیشتر از ۳۶ کاراکتر باشد.'),
    sandbox: z.boolean(),
  }),
  callbackBaseUrl: z.string().max(500),
});

export const subscriptionPlanSchema = z.object({
  id: z.string().min(1).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  type: z.enum(['digital', 'print', 'combo']),
  price: z.number().int().min(0).max(999_999_999),
  discountType: z.enum(['none', 'percent', 'fixed']).optional(),
  discountValue: z.number().int().min(0).max(999_999_999).optional(),
  period: z.enum(['monthly', 'yearly']),
  periodMonths: z.number().int().min(1).max(36),
  features: z.array(z.string().min(1).max(200)).max(20),
  popular: z.boolean().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export const subscriptionPlansSchema = z.array(subscriptionPlanSchema).min(1).max(20);

export const discountCodeAdminSchema = z
  .object({
    id: z.string().min(1).max(80).optional(),
    code: z
      .string()
      .min(3)
      .max(40)
      .transform((v) => v.trim().toUpperCase().replace(/\s+/g, ''))
      .refine((v) => /^[A-Z0-9_-]+$/.test(v), 'کد فقط حروف انگلیسی، عدد، - و _'),
    title: z.string().min(2).max(120),
    description: z.string().max(500).optional().nullable(),
    type: z.enum(['PERCENT', 'FIXED']),
    value: z.number().int().min(1).max(999_999_999),
    scope: z.enum(['ALL', 'SELECTED']),
    planSlugs: z.array(z.string().min(2).max(80)).max(40).default([]),
    maxUses: z.number().int().min(1).max(1_000_000).optional().nullable(),
    maxUsesPerUser: z.number().int().min(1).max(100).optional().nullable(),
    minSubtotal: z.number().int().min(0).max(999_999_999).optional().nullable(),
    startsAt: z.string().datetime().optional().nullable(),
    endsAt: z.string().datetime().optional().nullable(),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'PERCENT' && data.value > 100) {
      ctx.addIssue({ code: 'custom', message: 'درصد تخفیف حداکثر ۱۰۰ است', path: ['value'] });
    }
    if (data.scope === 'SELECTED' && data.planSlugs.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'حداقل یک محصول برای کد انتخابی لازم است',
        path: ['planSlugs'],
      });
    }
  });

export const customGeoLayerSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  geoJsonUrl: z.string().max(2000),
  enabled: z.boolean(),
  opacity: z.number().min(0).max(1),
  color: z.string().max(20),
  zIndex: z.number().int().min(0).max(999),
  sourceFormat: z.enum(['geojson', 'kml', 'kmz', 'url']).optional(),
  originalFileName: z.string().max(255).optional(),
});

export const mapConfigSchema = z.object({
  googleEnabled: z.boolean(),
  googleApiKey: z.string().max(512),
  defaultBasemap: z.enum([
    'osm',
    'osmHot',
    'carto',
    'topo',
    'googleRoad',
    'googleSatellite',
    'googleHybrid',
  ]),
  layerVisibility: z.object({
    osm: z.boolean(),
    osmHot: z.boolean(),
    carto: z.boolean(),
    topo: z.boolean(),
    googleRoad: z.boolean(),
    googleSatellite: z.boolean(),
    googleHybrid: z.boolean(),
  }),
  customLayers: z.array(customGeoLayerSchema).max(20),
  showAdvertisersOnMap: z.boolean(),
  showMessagesOnMap: z.boolean(),
});

export const subscriptionCheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        planSlug: z.string().min(2).max(80),
        quantity: z.number().int().min(1).max(12),
      }),
    )
    .min(1)
    .max(8),
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(8).max(20),
  deliveryPhone: z.string().min(8).max(20).optional(),
  province: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  address: z.string().max(500).optional(),
  postalCode: z.string().max(20).optional(),
  discountCode: z.string().max(40).optional(),
});

export const customerAddressSchema = z.object({
  name: z.string().min(2).max(100),
  deliveryPhone: z.string().min(8).max(20),
  province: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  address: z.string().min(5).max(500),
});

export const subscriberLookupSchema = z.object({
  email: z.string().email().max(255),
});

export const subscriberAddressSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  province: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  address: z.string().min(5).max(500),
});
