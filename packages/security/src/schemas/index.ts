import { z } from 'zod';
import { isValidIranPhone, normalizeIranPhone } from '../phone';

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(3, 'ایمیل یا نام کاربری الزامی است').max(255).optional(),
    password: z.string().min(8, 'رمز عبور حداقل ۸ کاراکتر').max(128).optional(),
    smsCode: z
      .string()
      .length(6, 'کد پیامکی باید ۶ رقم باشد')
      .regex(/^\d{6}$/, 'کد پیامکی نامعتبر است')
      .optional(),
    totpCode: z
      .string()
      .length(6, 'کد احراز باید ۶ رقم باشد')
      .regex(/^\d{6}$/, 'کد احراز نامعتبر است')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.smsCode || data.totpCode) return;
    if (!data.identifier?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ایمیل یا نام کاربری الزامی است',
        path: ['identifier'],
      });
    }
    if (!data.password || data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رمز عبور حداقل ۸ کاراکتر',
        path: ['password'],
      });
    }
  });

/** @deprecated Use loginSchema with `identifier` instead */
export const legacyLoginSchema = z.object({
  email: z.string().email('ایمیل نامعتبر است').max(255),
  password: z.string().min(8, 'رمز عبور حداقل ۸ کاراکتر').max(128),
  totp: z.string().length(6).optional(),
});

const optionalGeoFields = {
  province: z
    .string()
    .max(50)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    }),
  city: z
    .string()
    .max(80)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    }),
};

function refineOptionalGeoPair(
  data: { province?: string; city?: string },
  ctx: z.RefinementCtx,
) {
  const hasProvince = Boolean(data.province);
  const hasCity = Boolean(data.city);
  if (hasProvince === hasCity) return;
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'لطفاً استان و شهر را با هم انتخاب کنید.',
    path: hasProvince ? ['city'] : ['province'],
  });
}

/** حذف کاراکترهای کنترلی و نرمال‌سازی فاصله‌ها */
function normalizeFormText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertSafePlainText(value: string, ctx: z.RefinementCtx, path: string[], label: string) {
  if (/[<>{}]|javascript:|data:text\/html|on\w+\s*=/i.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `لطفاً ${label} را بدون کد یا کاراکترهای خاص وارد کنید.`,
      path,
    });
  }
}

const personNameRegex =
  /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFA-Za-z][\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFA-Za-z\s.'’\-]{1,98}$/;

export const contactFormSchema = z
  .object({
    name: z
      .string()
      .max(100)
      .transform(normalizeFormText)
      .pipe(
        z
          .string()
          .min(2, 'لطفاً نام و نام‌خانوادگی خود را کامل وارد کنید.')
          .max(100, 'نام واردشده طولانی است.'),
      ),
    email: z
      .string()
      .max(255)
      .transform((value) => value.trim().toLowerCase())
      .pipe(
        z
          .string()
          .email('لطفاً یک ایمیل معتبر وارد کنید.')
          .max(255, 'ایمیل واردشده طولانی است.'),
      ),
    subject: z
      .string()
      .max(200)
      .transform(normalizeFormText)
      .pipe(
        z
          .string()
          .min(3, 'لطفاً موضوع پیام را بنویسید.')
          .max(200, 'موضوع پیام طولانی است.'),
      ),
    body: z
      .string()
      .max(5000)
      .transform((value) =>
        value
          .normalize('NFC')
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
          .replace(/\r\n/g, '\n')
          .trim(),
      )
      .pipe(
        z
          .string()
          .min(10, 'لطفاً متن پیام را کمی کامل‌تر بنویسید.')
          .max(5000, 'متن پیام طولانی است.'),
      ),
  })
  .extend(optionalGeoFields)
  .superRefine((data, ctx) => {
    refineOptionalGeoPair(data, ctx);
    if (!personNameRegex.test(data.name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'نام فقط می‌تواند شامل حروف و فاصله باشد.',
        path: ['name'],
      });
    }
    assertSafePlainText(data.name, ctx, ['name'], 'نام');
    assertSafePlainText(data.subject, ctx, ['subject'], 'موضوع');
    assertSafePlainText(data.body, ctx, ['body'], 'پیام');
    if ((data.body.match(/https?:\/\//gi) ?? []).length > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'لطفاً تعداد لینک‌های داخل پیام را کمتر کنید.',
        path: ['body'],
      });
    }
  });

export const newsletterSchema = z.object({
  email: z.string().email().max(255),
});

export const articleSchema = z.object({
  title: z.string().min(3).max(300),
  content: z.string().min(1).max(500_000),
  excerpt: z.string().max(1000).optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  ogImage: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  coverImage: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const ticketSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(10000),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
});

export const dataDeletionSchema = z.object({
  email: z.string().email().max(255),
  reason: z.string().max(2000).optional(),
});

export const adRequestAdTypes = [
  'print-full',
  'print-half',
  'digital-banner',
  'digital-sponsor',
] as const;

export const adRequestFormSchema = z
  .object({
    company: z
      .string()
      .transform(normalizeFormText)
      .pipe(
        z
          .string()
          .min(2, 'لطفاً نام شرکت یا برند را وارد کنید.')
          .max(150, 'نام شرکت طولانی است.'),
      ),
    contactName: z
      .string()
      .transform(normalizeFormText)
      .pipe(
        z
          .string()
          .min(2, 'لطفاً نام مسئول را وارد کنید.')
          .max(100, 'نام مسئول طولانی است.'),
      ),
    phone: z
      .string()
      .transform((value) => value.trim())
      .superRefine((value, ctx) => {
        if (!isValidIranPhone(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'شماره موبایل معتبر نیست. نمونه: 09123456789',
          });
        }
      })
      .transform((value) => normalizeIranPhone(value)),
    email: z
      .string()
      .transform((value) => value.trim().toLowerCase())
      .pipe(z.string().email('لطفاً یک ایمیل معتبر وارد کنید.').max(255)),
    adType: z
      .string()
      .transform((value) => value.trim())
      .pipe(
        z
          .string()
          .min(1, 'لطفاً نوع تبلیغ را انتخاب کنید.')
          .max(40, 'نوع تبلیغ نامعتبر است.')
          .regex(/^[a-zA-Z0-9_-]+$/, 'نوع تبلیغ نامعتبر است.'),
      ),
    description: z
      .string()
      .transform(normalizeFormText)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined))
      .pipe(z.string().max(3000, 'توضیحات طولانی است.').optional()),
  })
  .extend(optionalGeoFields)
  .superRefine(refineOptionalGeoPair);

export const articleSubmissionCategories = [
  'politics',
  'economy',
  'culture',
  'technology',
] as const;

export const articleSubmissionFormSchema = z.object({
  authorName: z
    .string()
    .transform(normalizeFormText)
    .pipe(
      z
        .string()
        .min(2, 'لطفاً نام خود را وارد کنید.')
        .max(100, 'نام واردشده طولانی است.'),
    ),
  email: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().email('لطفاً یک ایمیل معتبر وارد کنید.').max(255)),
  title: z
    .string()
    .transform(normalizeFormText)
    .pipe(
      z
        .string()
        .min(5, 'لطفاً عنوان مقاله را کامل‌تر بنویسید.')
        .max(300, 'عنوان مقاله طولانی است.'),
    ),
  category: z.enum(articleSubmissionCategories, {
    message: 'لطفاً دسته‌بندی را انتخاب کنید.',
  }),
  summary: z
    .string()
    .transform(normalizeFormText)
    .pipe(
      z
        .string()
        .min(20, 'لطفاً خلاصه مقاله را کمی کامل‌تر بنویسید.')
        .max(5000, 'خلاصه مقاله طولانی است.'),
    ),
  fileName: z
    .string()
    .max(255)
    .optional()
    .transform((value) => (value && value.trim() ? value.replace(/[/\\]/g, '').slice(0, 255) : undefined)),
  fileUrl: z
    .string()
    .max(500)
    .optional()
    .refine(
      (value) => !value || /^\/uploads\/submissions\/\d{4}\/\d{2}\/[A-Za-z0-9._\u0600-\u06FF-]+$/.test(value),
      'آدرس فایل مقاله نامعتبر است.',
    ),
});

export const collaborationApplicationFormSchema = z.object({
  fullName: z
    .string()
    .transform(normalizeFormText)
    .pipe(
      z
        .string()
        .min(2, 'لطفاً نام و نام‌خانوادگی خود را وارد کنید.')
        .max(100, 'نام واردشده طولانی است.'),
    ),
  email: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().email('لطفاً یک ایمیل معتبر وارد کنید.').max(255)),
  phone: z
    .string()
    .transform((value) => value.trim())
    .superRefine((value, ctx) => {
      if (!isValidIranPhone(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'شماره موبایل معتبر نیست. نمونه: 09123456789',
        });
      }
    })
    .transform((value) => normalizeIranPhone(value)),
  collaborationType: z
    .string()
    .transform(normalizeFormText)
    .pipe(
      z
        .string()
        .min(2, 'لطفاً نوع همکاری را انتخاب کنید.')
        .max(80, 'نوع همکاری نامعتبر است.')
        .regex(/^[a-zA-Z0-9_-]+$/, 'نوع همکاری نامعتبر است.'),
    ),
  collaborationTypeLabel: z.string().max(120).optional(),
  message: z
    .string()
    .transform(normalizeFormText)
    .pipe(
      z
        .string()
        .min(20, 'لطفاً توضیحات همکاری را کمی کامل‌تر بنویسید.')
        .max(4000, 'توضیحات طولانی است.'),
    ),
  portfolioUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .superRefine((value, ctx) => {
      if (!value) return;
      try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'لینک نمونه‌کار باید با http یا https شروع شود.',
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'لطفاً یک لینک معتبر وارد کنید.',
        });
      }
    }),
  resumeFileName: z
    .string()
    .max(255)
    .optional()
    .transform((value) => (value && value.trim() ? value.replace(/[/\\]/g, '').slice(0, 255) : undefined)),
  resumeUrl: z
    .string()
    .min(1, 'لطفاً فایل رزومه را پیوست کنید.')
    .max(500, 'آدرس فایل رزومه نامعتبر است.')
    .refine(
      (value) => /^\/uploads\/resumes\/\d{4}\/\d{2}\/[A-Za-z0-9._\u0600-\u06FF-]+$/.test(value),
      'آدرس فایل رزومه نامعتبر است.',
    ),
});

export const commentSchema = z.object({
  articleId: z.string().cuid(),
  authorName: z.string().min(2).max(80),
  content: z.string().min(3).max(2000),
});

export function parseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): z.infer<T> {
  const raw = Object.fromEntries(formData.entries());
  return schema.parse(raw);
}

export function parseJson<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

export {
  siteBrandingSchema,
  siteFooterSchema,
  siteContactSchema,
  siteNewsletterSchema,
  emailConfigSchema,
  smsConfigSchema,
  webhookSchema,
  satisfactionSurveySchema,
  messageTemplateSchema,
  paymentConfigSchema,
  mapConfigSchema,
  customGeoLayerSchema,
  subscriptionPlanSchema,
  subscriptionPlansSchema,
  discountCodeAdminSchema,
  subscriptionCheckoutSchema,
  customerAddressSchema,
  subscriberLookupSchema,
  subscriberAddressSchema,
} from './settings';
