'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma, IssueStatus, AuditAction, Prisma } from '@vargah/database';
import { createSlug, ensureUniqueSlug } from '@vargah/seo/slug';

import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { issueFormSchema } from '@/lib/schemas/issue-form';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import { revalidateWeb } from '@/lib/revalidate-web';

async function uniqueIssueSlug(title: string, number: number, excludeId?: string) {
  const base = createSlug(`${title}-${number}`, 'latin');
  return ensureUniqueSlug(base, async (slug) => {
    const existing = await prisma.issue.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return Boolean(existing);
  });
}

function parseIssueForm(formData: FormData) {
  const tocRaw = formData.get('tableOfContents');
  let tableOfContents: unknown[] = [];
  if (typeof tocRaw === 'string' && tocRaw.trim()) {
    try {
      tableOfContents = JSON.parse(tocRaw);
    } catch {
      throw new Error('فرمت فهرست مطالب نامعتبر است');
    }
  }

  return issueFormSchema.parse({
    number: formData.get('number'),
    title: formData.get('title'),
    description: formData.get('description') || '',
    pageCount: formData.get('pageCount') || '0',
    status: formData.get('status') || IssueStatus.DRAFT,
    publishedAt: formData.get('publishedAt') || '',
    pdfUrl: formData.get('pdfUrl') || '',
    coverImage: formData.get('coverImage') || '',
    tableOfContents,
  });
}

async function syncIssueArticles(issueId: string, toc: { articleId?: string }[]) {
  const articleIds = toc.map((e) => e.articleId).filter((id): id is string => Boolean(id));

  await prisma.article.updateMany({
    where: { issueId, id: { notIn: articleIds } },
    data: { issueId: null },
  });

  if (articleIds.length > 0) {
    await prisma.article.updateMany({
      where: { id: { in: articleIds } },
      data: { issueId },
    });
  }
}

async function revalidateIssue(slug: string, status: IssueStatus) {
  revalidatePath('/content/issues');
  if (status === IssueStatus.PUBLISHED) {
    await revalidateWeb({
      tags: ['issues', `issue:${slug}`],
      paths: [`/issues/${slug}`, '/sitemap.xml'],
    });
  }
}

export async function createIssue(formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ISSUE_CREATE);
  const parsed = parseIssueForm(formData);

  const numberExists = await prisma.issue.findUnique({ where: { number: parsed.number } });
  if (numberExists) throw new Error('این شماره قبلاً ثبت شده است');

  const slug = await uniqueIssueSlug(parsed.title, parsed.number);
  const publishedAt = parsed.publishedAt ? new Date(parsed.publishedAt) : null;

  const issue = await prisma.issue.create({
    data: {
      number: parsed.number,
      title: parsed.title,
      slug,
      description: parsed.description || null,
      pageCount: parsed.pageCount,
      pdfUrl: parsed.pdfUrl || null,
      coverImage: parsed.coverImage || null,
      tableOfContents: parsed.tableOfContents,
      status: parsed.status,
      publishedAt:
        parsed.status === IssueStatus.PUBLISHED && !publishedAt ? new Date() : publishedAt,
    } as Prisma.IssueUncheckedCreateInput,
  });

  await syncIssueArticles(issue.id, parsed.tableOfContents);

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'Issue',
    entityId: issue.id,
    changes: { number: parsed.number, title: parsed.title },
  });

  await revalidateIssue(slug, parsed.status);
  redirect(`/content/issues/${issue.id}`);
}

export async function updateIssue(id: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ISSUE_EDIT);
  const parsed = parseIssueForm(formData);

  const existing = await prisma.issue.findUnique({ where: { id } });
  if (!existing) throw new Error('شماره یافت نشد');

  if (parsed.number !== existing.number) {
    const numberExists = await prisma.issue.findFirst({
      where: { number: parsed.number, id: { not: id } },
    });
    if (numberExists) throw new Error('این شماره قبلاً ثبت شده است');
  }

  const slug =
    existing.title !== parsed.title || existing.number !== parsed.number
      ? await uniqueIssueSlug(parsed.title, parsed.number, id)
      : existing.slug;

  const publishedAt = parsed.publishedAt ? new Date(parsed.publishedAt) : existing.publishedAt;

  await prisma.issue.update({
    where: { id },
    data: {
      number: parsed.number,
      title: parsed.title,
      slug,
      description: parsed.description || null,
      pageCount: parsed.pageCount,
      pdfUrl: parsed.pdfUrl || null,
      coverImage: parsed.coverImage || null,
      tableOfContents: parsed.tableOfContents,
      status: parsed.status,
      publishedAt:
        parsed.status === IssueStatus.PUBLISHED && !publishedAt ? new Date() : publishedAt,
    } as Prisma.IssueUncheckedUpdateInput,
  });

  await syncIssueArticles(id, parsed.tableOfContents);

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Issue',
    entityId: id,
    changes: { status: parsed.status, number: parsed.number },
  });

  revalidatePath(`/content/issues/${id}`);
  await revalidateIssue(slug, parsed.status);
}

export async function deleteIssue(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ISSUE_DELETE);

  const existing = await prisma.issue.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) throw new Error('شماره یافت نشد');

  await prisma.article.updateMany({ where: { issueId: id }, data: { issueId: null } });
  await prisma.issue.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'Issue',
    entityId: id,
  });

  revalidatePath('/content/issues');
  await revalidateWeb({ tags: ['issues'], paths: ['/sitemap.xml'] });
  redirect('/content/issues');
}

export async function getSuggestedIssueNumber() {
  const latest = await prisma.issue.findFirst({
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return (latest?.number ?? 0) + 1;
}
