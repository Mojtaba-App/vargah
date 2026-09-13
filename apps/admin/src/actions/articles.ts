'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma, ArticleStatus, WorkflowStage, AuditAction, UserRole } from '@vargah/database';
import { articleSchema } from '@vargah/security/schemas';
import { sanitizeArticleHtml } from '@vargah/security/sanitize';
import { resolvePublishedAt, shouldRevalidateOnPublish } from '@vargah/business/publication';
import { estimateReadingMinutes } from '@vargah/business/reading-time';
import { createSlug, ensureUniqueSlug } from '@vargah/seo/slug';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import { revalidateWeb } from '@/lib/revalidate-web';

async function uniqueArticleSlug(title: string, excludeId?: string) {
  const base = createSlug(title, 'latin');
  return ensureUniqueSlug(base, async (slug) => {
    const existing = await prisma.article.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return Boolean(existing);
  });
}

function parseArticleForm(formData: FormData) {
  return articleSchema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
    excerpt: formData.get('excerpt') || null,
    categoryId: formData.get('categoryId') || null,
    metaTitle: formData.get('metaTitle') || null,
    metaDescription: formData.get('metaDescription') || null,
    ogImage: formData.get('ogImage') || null,
    coverImage: formData.get('coverImage') || null,
    scheduledAt: formData.get('scheduledAt') || null,
  });
}

function parseArticleFlags(formData: FormData) {
  return {
    isFeatured: formData.get('isFeatured') === 'on',
    isEditorsPick: formData.get('isEditorsPick') === 'on',
  };
}

const PUBLISH_STATUSES = new Set<ArticleStatus>([ArticleStatus.PUBLISHED, ArticleStatus.SCHEDULED]);

async function assertArticleStatusPermission(
  role: UserRole,
  nextStatus: ArticleStatus,
  currentStatus: ArticleStatus,
) {
  if (PUBLISH_STATUSES.has(nextStatus) && nextStatus !== currentStatus) {
    if (!(await hasPermissionAsync(role, PERMISSIONS.ARTICLE_PUBLISH))) {
      throw new Error('دسترسی انتشار یا زمان‌بندی مقاله ندارید');
    }
  }
}

export async function createArticle(formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ARTICLE_CREATE);

  const parsed = parseArticleForm(formData);
  const flags = parseArticleFlags(formData);
  if (parsed.scheduledAt) {
    await assertArticleStatusPermission(session.user.role as UserRole, ArticleStatus.SCHEDULED, ArticleStatus.DRAFT);
  }
  const slug = await uniqueArticleSlug(parsed.title);
  const content = sanitizeArticleHtml(parsed.content);

  const article = await prisma.article.create({
    data: {
      title: parsed.title,
      slug,
      content,
      excerpt: parsed.excerpt,
      categoryId: parsed.categoryId,
      coverImage: parsed.coverImage,
      metaTitle: parsed.metaTitle,
      metaDescription: parsed.metaDescription,
      ogImage: parsed.ogImage || null,
      authorId: session.user.id,
      status: parsed.scheduledAt ? ArticleStatus.SCHEDULED : ArticleStatus.DRAFT,
      scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
      workflowStage: WorkflowStage.WRITER,
      readingTime: estimateReadingMinutes(content),
      isFeatured: flags.isFeatured,
      isEditorsPick: flags.isEditorsPick,
    },
  });

  await prisma.articleVersion.create({
    data: {
      articleId: article.id,
      title: parsed.title,
      content,
      version: 1,
      createdBy: session.user.id,
      note: 'ایجاد اولیه',
    },
  });

  await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE,
      entity: 'Article',
      entityId: article.id,
    });

  revalidatePath('/content/articles');
  redirect(`/content/articles/${article.id}`);
}

export async function updateArticle(id: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ARTICLE_EDIT);

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw new Error('Article not found');

  const parsed = parseArticleForm(formData);
  const flags = parseArticleFlags(formData);
  const status = formData.get('status') as ArticleStatus;
  await assertArticleStatusPermission(session.user.role as UserRole, status, existing.status);
  const slug =
    existing.title !== parsed.title ? await uniqueArticleSlug(parsed.title, id) : existing.slug;
  const content = sanitizeArticleHtml(parsed.content);

  const lastVersion = await prisma.articleVersion.findFirst({
    where: { articleId: id },
    orderBy: { version: 'desc' },
  });

  const publishedAt = resolvePublishedAt(status, existing.publishedAt);

  await prisma.article.update({
    where: { id },
    data: {
      title: parsed.title,
      slug,
      content,
      excerpt: parsed.excerpt,
      categoryId: parsed.categoryId,
      coverImage: parsed.coverImage,
      status,
      metaTitle: parsed.metaTitle,
      metaDescription: parsed.metaDescription,
      ogImage: parsed.ogImage || null,
      publishedAt,
      scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
      readingTime: estimateReadingMinutes(content),
      isFeatured: flags.isFeatured,
      isEditorsPick: flags.isEditorsPick,
    },
  });

  await prisma.articleVersion.create({
    data: {
      articleId: id,
      title: parsed.title,
      content,
      version: (lastVersion?.version ?? 0) + 1,
      createdBy: session.user.id,
    },
  });

  await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: 'Article',
      entityId: id,
    });

  revalidatePath('/content/articles');
  revalidatePath(`/content/articles/${id}`);

  if (shouldRevalidateOnPublish(status, existing.status)) {
    await revalidateWeb({
      tags: ['articles', `article:${slug}`, 'categories'],
      paths: ['/', `/articles/${slug}`, '/articles', '/sitemap.xml'],
    });
  } else if (status === ArticleStatus.PUBLISHED) {
    await revalidateWeb({
      tags: ['articles', `article:${slug}`],
      paths: ['/', `/articles/${slug}`, '/articles'],
    });
  }
}

export async function deleteArticle(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.ARTICLE_DELETE);
  const article = await prisma.article.findUnique({ where: { id }, select: { slug: true } });
  await prisma.article.delete({ where: { id } });
  await recordAuditLog({ userId: session.user.id, action: AuditAction.DELETE, entity: 'Article', entityId: id });
  revalidatePath('/content/articles');
  if (article?.slug) {
    await revalidateWeb({ tags: ['articles'], paths: ['/sitemap.xml'] });
  }
}
