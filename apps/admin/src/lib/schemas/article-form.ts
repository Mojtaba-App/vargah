import { z } from 'zod';
import { ArticleStatus } from '@vargah/database/enums';
import { estimateReadingMinutes, stripHtml } from '@vargah/business/reading-time';

export { estimateReadingMinutes };

const optionalImageUrl = z
  .string()
  .max(500)
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || v.startsWith('/') || /^https?:\/\/.+/i.test(v), {
    message: 'آدرس تصویر معتبر وارد کنید',
  });

const articleFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'عنوان حداقل ۳ کاراکتر باشد')
    .max(300, 'عنوان حداکثر ۳۰۰ کاراکتر'),
  excerpt: z.string().max(1000, 'خلاصه حداکثر ۱۰۰۰ کاراکتر').optional().or(z.literal('')),
  content: z
    .string()
    .refine((html) => stripHtml(html).length >= 10, 'متن مقاله باید حداقل ۱۰ کاراکتر باشد'),
  categoryId: z.string().optional().or(z.literal('')),
  coverImage: optionalImageUrl,
  metaTitle: z.string().max(200, 'حداکثر ۲۰۰ کاراکتر').optional().or(z.literal('')),
  metaDescription: z.string().max(500, 'حداکثر ۵۰۰ کاراکتر').optional().or(z.literal('')),
  ogImage: optionalImageUrl,
  scheduledAt: z.string().optional().or(z.literal('')),
  isFeatured: z.boolean().optional(),
  isEditorsPick: z.boolean().optional(),
});

export const articleCreateFormSchema = articleFieldsSchema;

export const articleUpdateFormSchema = articleFieldsSchema.extend({
  status: z.nativeEnum(ArticleStatus),
});

export type ArticleCreateFormValues = z.infer<typeof articleCreateFormSchema>;
export type ArticleUpdateFormValues = z.infer<typeof articleUpdateFormSchema>;
export type ArticleFormValues = ArticleCreateFormValues;
