import { z } from 'zod';

const slugSchema = z
  .string()
  .max(120)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v?.trim() ? v.trim() : undefined));

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'نام حداقل ۲ کاراکتر').max(100),
  slug: slugSchema,
  description: z.string().max(500).optional().or(z.literal('')),
  parentId: z.string().cuid().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
});

export const tagFormSchema = z.object({
  name: z.string().trim().min(2, 'نام حداقل ۲ کاراکتر').max(80),
  slug: slugSchema,
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type TagFormValues = z.infer<typeof tagFormSchema>;
