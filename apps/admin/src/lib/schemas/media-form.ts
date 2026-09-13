import { z } from 'zod';

function parseTagsValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean);
      }
    } catch {
      // fall through to comma split
    }
    return value
      .split(/[,،]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

const tagsSchema = z
  .preprocess(parseTagsValue, z.array(z.string().trim().min(1, 'برچسب خالی').max(50)).max(20))
  .optional()
  .default([]);

export const mediaUpdateSchema = z.object({
  alt: z.string().max(300).optional().or(z.literal('')),
  tags: tagsSchema,
});

export type MediaUpdateValues = z.infer<typeof mediaUpdateSchema>;
