import { z } from 'zod';
import { IssueStatus } from '@vargah/database/enums';

const optionalUrl = z
  .string()
  .max(500)
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v), {
    message: 'آدرس فایل نامعتبر است',
  });

const tocEntrySchema = z.object({
  title: z.string().trim().min(1, 'عنوان فهرست الزامی است').max(300),
  page: z.number().int().min(1).max(9999).optional(),
  articleId: z.string().cuid().optional(),
});

export const issueFormSchema = z.object({
  number: z.coerce.number().int('شماره باید عدد صحیح باشد').min(1, 'شماره باید بزرگ‌تر از ۰ باشد').max(9999),
  title: z.string().trim().min(3, 'عنوان حداقل ۳ کاراکتر').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  pageCount: z.coerce.number().int().min(0).max(9999).optional().default(0),
  status: z.nativeEnum(IssueStatus),
  publishedAt: z.string().optional().or(z.literal('')),
  pdfUrl: optionalUrl,
  coverImage: optionalUrl,
  tableOfContents: z.array(tocEntrySchema).optional().default([]),
});

export type IssueFormInput = z.input<typeof issueFormSchema>;
export type IssueFormValues = z.output<typeof issueFormSchema>;

export function serializeTocForForm(value: unknown): IssueFormValues['tableOfContents'] {
  if (!Array.isArray(value)) return [];
  const parsed: IssueFormValues['tableOfContents'] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const record = item as Record<string, unknown>;
    const result = tocEntrySchema.safeParse({
      title: record.title,
      page: record.page,
      articleId: record.articleId,
    });
    if (result.success) parsed.push(result.data);
  }
  return parsed;
}

export function buildIssueFormDefaults(issue: {
  number: number;
  title: string;
  description: string | null;
  pageCount: number;
  status: IssueStatus;
  publishedAt: Date | null;
  pdfUrl: string | null;
  coverImage: string | null;
  tableOfContents?: unknown | null;
  slug: string;
}): Partial<IssueFormValues> & { slug: string } {
  return {
    slug: issue.slug,
    number: issue.number,
    title: issue.title,
    description: issue.description ?? '',
    pageCount: issue.pageCount,
    status: issue.status,
    publishedAt: issue.publishedAt ? issue.publishedAt.toISOString() : '',
    pdfUrl: issue.pdfUrl ?? '',
    coverImage: issue.coverImage ?? '',
    tableOfContents: serializeTocForForm(issue.tableOfContents ?? null),
  };
}
