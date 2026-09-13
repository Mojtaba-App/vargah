'use server';

import { prisma, ArticleStatus } from '@vargah/database';
import {
  adRequestFormSchema,
  articleSubmissionFormSchema,
  collaborationApplicationFormSchema,
  commentSchema,
  contactFormSchema,
  dataDeletionSchema,
  newsletterSchema,
} from '@vargah/security/schemas';
import { z } from 'zod';
import { sanitizePlainText } from '@vargah/security/sanitize';
import { getActiveAdPricing, getActiveCollaborationTypes } from '@vargah/business/services-content';
import { subscriberCityUpdate } from '@vargah/business/subscriber-location';
import { isValidIranProvinceCity } from '@vargah/business/iran-locations';
import { rateLimitOrThrow } from '@/lib/rate-limit';
import { getServicesContent } from '@/lib/services-content';
import { saveCollaborationDocument } from '@/lib/collaboration-upload';
import { requireCustomerSession } from '@/actions/customer-auth';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import {
  toPublicUserError,
  zodFieldErrors,
  type FormActionResult,
} from '@/lib/forms/public-errors';

const FORM_LIMIT = 5;
const FORM_WINDOW_MS = 15 * 60 * 1000;

const CONTACT_FIELDS = ['name', 'email', 'subject', 'body', 'province', 'city'] as const;
const NEWSLETTER_FIELDS = ['email'] as const;
const COMMENT_FIELDS = ['authorName', 'content', 'articleId'] as const;

async function resolveAdTypeLabel(adType: string): Promise<string> {
  const content = await getServicesContent();
  const pricing = getActiveAdPricing(content.advertising.pricing);
  const item = pricing.find((p) => p.id === adType);
  if (!item) {
    throw new Error('نوع تبلیغ انتخاب‌شده معتبر نیست. لطفاً دوباره انتخاب کنید.');
  }

  return `${item.name} (${item.size})`;
}

const ARTICLE_CATEGORY_LABELS: Record<z.infer<typeof articleSubmissionFormSchema>['category'], string> = {
  politics: 'سیاست و جامعه',
  economy: 'اقتصاد',
  culture: 'فرهنگ و هنر',
  technology: 'فناوری',
};

async function assertFormRateLimit(key: string) {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('سرویس موقتاً در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.');
    }
    return;
  }
  try {
    await rateLimitOrThrow(key, FORM_LIMIT, FORM_WINDOW_MS);
  } catch {
    throw new Error('تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید.');
  }
}

async function assertFormMutation() {
  try {
    await verifyCsrfFromRequest();
  } catch (error) {
    throw new Error(toPublicUserError(error, 'نشست امنیتی منقضی شده است. صفحه را تازه کنید.'));
  }
}

function publicZodError(error: unknown, fallback: string): never {
  throw new Error(toPublicUserError(error, fallback));
}

export async function submitContactForm(
  formData: FormData,
): Promise<FormActionResult<(typeof CONTACT_FIELDS)[number]>> {
  try {
    await assertFormMutation();
  } catch (error) {
    return {
      ok: false,
      message: toPublicUserError(error, 'نشست امنیتی منقضی شده است. صفحه را تازه کنید.'),
    };
  }

  const raw = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    body: String(formData.get('body') ?? ''),
    province: formData.get('province') ? String(formData.get('province')) : undefined,
    city: formData.get('city') ? String(formData.get('city')) : undefined,
  };

  const parsedResult = contactFormSchema.safeParse(raw);
  if (!parsedResult.success) {
    return {
      ok: false,
      message: 'لطفاً اطلاعات فرم را بررسی و دوباره ارسال کنید.',
      fields: zodFieldErrors(parsedResult.error, CONTACT_FIELDS),
    };
  }
  const parsed = parsedResult.data;

  try {
    await assertFormRateLimit(`contact:${parsed.email}`);
  } catch (error) {
    return {
      ok: false,
      message: toPublicUserError(error, 'تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید.'),
    };
  }

  if (parsed.province && parsed.city && !isValidIranProvinceCity(parsed.province, parsed.city)) {
    return {
      ok: false,
      message: 'لطفاً استان و شهر را درست انتخاب کنید.',
      fields: { city: 'لطفاً استان و شهر را درست انتخاب کنید.' },
    };
  }

  const location = subscriberCityUpdate(parsed.province, parsed.city);
  if ((parsed.province || parsed.city) && !location.cityId) {
    return {
      ok: false,
      message: 'لطفاً استان و شهر را درست انتخاب کنید.',
      fields: { city: 'لطفاً استان و شهر را درست انتخاب کنید.' },
    };
  }

  try {
    await prisma.message.create({
      data: {
        type: 'CONTACT',
        senderName: sanitizePlainText(parsed.name),
        senderEmail: parsed.email,
        subject: sanitizePlainText(parsed.subject),
        body: sanitizePlainText(parsed.body),
        province: location.province,
        city: location.city,
        cityId: location.cityId,
      },
    });
  } catch {
    return { ok: false, message: 'ارسال پیام ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.' };
  }

  return { ok: true };
}

export async function submitNewsletter(
  email: string,
): Promise<FormActionResult<(typeof NEWSLETTER_FIELDS)[number], { alreadySubscribed?: boolean }>> {
  try {
    await assertFormMutation();
  } catch (error) {
    return {
      ok: false,
      message: toPublicUserError(error, 'نشست امنیتی منقضی شده است. صفحه را تازه کنید.'),
    };
  }

  const parsedResult = newsletterSchema.safeParse({ email });
  if (!parsedResult.success) {
    return {
      ok: false,
      message: 'لطفاً یک ایمیل معتبر وارد کنید.',
      fields: zodFieldErrors(parsedResult.error, NEWSLETTER_FIELDS),
    };
  }
  const parsed = parsedResult.data;

  try {
    await assertFormRateLimit(`newsletter:${parsed.email}`);
  } catch (error) {
    return {
      ok: false,
      message: toPublicUserError(error, 'تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید.'),
    };
  }

  const { headers } = await import('next/headers');
  const h = await headers();
  const { subscribeToNewsletter } = await import('@vargah/business/newsletter');

  try {
    const result = await subscribeToNewsletter(parsed.email, {
      source: 'website',
      consentIp: h.get('x-forwarded-for')?.split(',')[0]?.trim()?.slice(0, 64) ?? null,
      userAgent: h.get('user-agent')?.slice(0, 512) ?? null,
    });
    return { ok: true as const, alreadySubscribed: result.alreadySubscribed };
  } catch (error) {
    return {
      ok: false,
      message: toPublicUserError(error, 'ثبت عضویت با خطا مواجه شد. لطفاً بعداً تلاش کنید.'),
    };
  }
}

export async function requestDataDeletion(formData: FormData) {
  await assertFormMutation();
  const parsed = dataDeletionSchema.parse({
    email: formData.get('email'),
    reason: formData.get('reason') || undefined,
  });

  await assertFormRateLimit(`deletion:${parsed.email}`);

  await prisma.dataDeletionRequest.create({
    data: {
      email: parsed.email,
      reason: parsed.reason ? sanitizePlainText(parsed.reason) : undefined,
    },
  });

  return { ok: true };
}

export async function submitAdRequest(formData: FormData) {
  await assertFormMutation();
  const fallback = 'ارسال درخواست تبلیغ ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.';

  let parsed;
  try {
    parsed = adRequestFormSchema.parse({
      company: String(formData.get('company') ?? ''),
      contactName: String(formData.get('contactName') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      adType: String(formData.get('adType') ?? ''),
      description: formData.get('description')
        ? String(formData.get('description'))
        : undefined,
      province: formData.get('province') ? String(formData.get('province')) : undefined,
      city: formData.get('city') ? String(formData.get('city')) : undefined,
    });
  } catch (error) {
    publicZodError(error, 'لطفاً اطلاعات فرم درخواست تبلیغ را بررسی کنید.');
  }

  try {
    await assertFormRateLimit(`ad-request:${parsed.email}`);
  } catch {
    throw new Error('تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید.');
  }

  if (parsed.province && parsed.city && !isValidIranProvinceCity(parsed.province, parsed.city)) {
    throw new Error('لطفاً استان و شهر را درست انتخاب کنید.');
  }

  const location = subscriberCityUpdate(parsed.province, parsed.city);
  if ((parsed.province || parsed.city) && !location.cityId) {
    throw new Error('لطفاً استان و شهر را درست انتخاب کنید.');
  }

  let adTypeLabel: string;
  try {
    adTypeLabel = await resolveAdTypeLabel(parsed.adType);
  } catch (error) {
    publicZodError(error, 'نوع تبلیغ انتخاب‌شده معتبر نیست. لطفاً دوباره انتخاب کنید.');
  }

  const bodyLines = [
    `شرکت/برند: ${sanitizePlainText(parsed.company)}`,
    `مسئول: ${sanitizePlainText(parsed.contactName)}`,
    `تلفن: ${parsed.phone}`,
    `نوع تبلیغ: ${adTypeLabel}`,
  ];
  if (parsed.description) {
    bodyLines.push('', sanitizePlainText(parsed.description));
  }

  try {
    await prisma.message.create({
      data: {
        type: 'ADVERTISEMENT',
        senderName: sanitizePlainText(parsed.contactName),
        senderEmail: parsed.email,
        senderPhone: parsed.phone,
        subject: `درخواست تبلیغ — ${sanitizePlainText(parsed.company)}`,
        body: bodyLines.join('\n'),
        province: location.province,
        city: location.city,
        cityId: location.cityId,
      },
    });
  } catch {
    throw new Error(fallback);
  }

  return { ok: true };
}

export async function submitArticleSubmission(formData: FormData) {
  await assertFormMutation();
  const fallback = 'ارسال مقاله ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.';
  const file = formData.get('file');

  let fileMeta: { url: string; fileName: string } | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      fileMeta = await saveCollaborationDocument(file, 'submissions');
    } catch (error) {
      publicZodError(error, 'آپلود فایل مقاله ناموفق بود. لطفاً PDF یا Word ارسال کنید.');
    }
  }

  let parsed;
  try {
    parsed = articleSubmissionFormSchema.parse({
      authorName: formData.get('authorName'),
      email: formData.get('email'),
      title: formData.get('title'),
      category: formData.get('category'),
      summary: formData.get('summary'),
      fileName: fileMeta?.fileName,
      fileUrl: fileMeta?.url,
    });
  } catch (error) {
    publicZodError(error, 'لطفاً اطلاعات فرم ارسال مقاله را بررسی کنید.');
  }

  await assertFormRateLimit(`article-submission:${parsed.email}`);

  const bodyLines = [
    'نوع درخواست: ارسال مقاله',
    `نویسنده: ${sanitizePlainText(parsed.authorName)}`,
    `دسته: ${ARTICLE_CATEGORY_LABELS[parsed.category]}`,
    '',
    sanitizePlainText(parsed.summary),
  ];
  if (parsed.fileUrl) {
    bodyLines.push('', `فایل مقاله: ${parsed.fileUrl}`);
    if (parsed.fileName) bodyLines.push(`نام فایل: ${parsed.fileName}`);
  }

  try {
    await prisma.message.create({
      data: {
        type: 'COLLABORATION',
        senderName: sanitizePlainText(parsed.authorName),
        senderEmail: parsed.email,
        subject: `مقاله — ${sanitizePlainText(parsed.title)}`,
        body: bodyLines.join('\n'),
      },
    });
  } catch {
    throw new Error(fallback);
  }

  return { ok: true };
}

export async function submitCollaborationApplication(formData: FormData) {
  await assertFormMutation();
  const fallback = 'ارسال درخواست همکاری ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.';
  const resume = formData.get('resume');

  let resumeMeta: { url: string; fileName: string } | null = null;
  if (resume instanceof File && resume.size > 0) {
    try {
      resumeMeta = await saveCollaborationDocument(resume, 'resumes');
    } catch (error) {
      publicZodError(error, 'آپلود رزومه ناموفق بود. لطفاً PDF یا Word ارسال کنید.');
    }
  } else {
    throw new Error('لطفاً فایل رزومه را پیوست کنید.');
  }

  const collaborationType = String(formData.get('collaborationType') ?? '').trim();
  const content = await getServicesContent();
  const types = getActiveCollaborationTypes(content.collaborate.collaborationTypes);
  const selectedType = types.find((t) => t.id === collaborationType);
  if (!selectedType) {
    throw new Error('لطفاً نوع همکاری را انتخاب کنید.');
  }

  let parsed;
  try {
    parsed = collaborationApplicationFormSchema.parse({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      collaborationType: selectedType.id,
      collaborationTypeLabel: selectedType.label,
      message: formData.get('message'),
      portfolioUrl: formData.get('portfolioUrl') || undefined,
      resumeFileName: resumeMeta.fileName,
      resumeUrl: resumeMeta.url,
    });
  } catch (error) {
    publicZodError(error, 'لطفاً اطلاعات فرم همکاری را بررسی کنید.');
  }

  await assertFormRateLimit(`collaboration:${parsed.email}`);

  const bodyLines = [
    'نوع درخواست: همکاری و رزومه',
    `نوع همکاری: ${sanitizePlainText(parsed.collaborationTypeLabel ?? selectedType.label)}`,
    `تلفن: ${parsed.phone}`,
    '',
    sanitizePlainText(parsed.message),
  ];
  if (parsed.portfolioUrl) {
    bodyLines.push('', `نمونه‌کار: ${parsed.portfolioUrl}`);
  }
  bodyLines.push('', `رزومه: ${parsed.resumeUrl}`);
  if (parsed.resumeFileName) bodyLines.push(`نام فایل: ${parsed.resumeFileName}`);

  try {
    await prisma.message.create({
      data: {
        type: 'COLLABORATION',
        senderName: sanitizePlainText(parsed.fullName),
        senderEmail: parsed.email,
        senderPhone: parsed.phone,
        subject: `همکاری — ${sanitizePlainText(parsed.collaborationTypeLabel ?? selectedType.label)}`,
        body: bodyLines.join('\n'),
      },
    });
  } catch {
    throw new Error(fallback);
  }

  return { ok: true };
}

export async function submitComment(input: {
  articleId: string;
  authorName: string;
  content: string;
}): Promise<FormActionResult<(typeof COMMENT_FIELDS)[number], { pending: true }>> {
  try {
    await assertFormMutation();
  } catch (error) {
    return {
      ok: false,
      message: toPublicUserError(error, 'نشست امنیتی منقضی شده است. صفحه را تازه کنید.'),
    };
  }

  let session;
  try {
    session = await requireCustomerSession();
  } catch {
    return { ok: false, message: 'برای ثبت نظر ابتدا وارد حساب کاربری شوید.' };
  }

  const parsedResult = commentSchema.safeParse(input);
  if (!parsedResult.success) {
    return {
      ok: false,
      message: 'لطفاً متن نظر را بررسی کنید.',
      fields: zodFieldErrors(parsedResult.error, COMMENT_FIELDS),
    };
  }
  const parsed = parsedResult.data;

  try {
    await assertFormRateLimit(`comment:${parsed.articleId}:${session.subscriberId}`);
  } catch (error) {
    return {
      ok: false,
      message: toPublicUserError(error, 'تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید.'),
    };
  }

  const article = await prisma.article.findFirst({
    where: { id: parsed.articleId, status: ArticleStatus.PUBLISHED },
    select: { id: true },
  });
  if (!article) {
    return { ok: false, message: 'مقاله یافت نشد یا دیگر در دسترس نیست.' };
  }

  const authorName = sanitizePlainText(
    session.name?.trim() || parsed.authorName || 'مشترک',
  );

  try {
    await prisma.articleComment.create({
      data: {
        articleId: parsed.articleId,
        authorName,
        content: sanitizePlainText(parsed.content),
      },
    });
  } catch {
    return { ok: false, message: 'ثبت نظر ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.' };
  }

  return { ok: true, pending: true };
}
