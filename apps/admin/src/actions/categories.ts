'use server';

import { revalidatePath } from 'next/cache';
import { prisma, AuditAction } from '@vargah/database';
import { createSlug, ensureUniqueSlug } from '@vargah/seo/slug';

import { recordAuditLog } from '@/lib/audit/record';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { categoryFormSchema, tagFormSchema } from '@/lib/schemas/taxonomy-form';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import { revalidateWeb } from '@/lib/revalidate-web';

async function uniqueCategorySlug(name: string, slugInput?: string, excludeId?: string) {
  const base = slugInput?.trim() || createSlug(name, 'latin');
  return ensureUniqueSlug(base, async (slug) => {
    const existing = await prisma.category.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return Boolean(existing);
  });
}

async function uniqueTagSlug(name: string, slugInput?: string, excludeId?: string) {
  const base = slugInput?.trim() || createSlug(name, 'latin');
  return ensureUniqueSlug(base, async (slug) => {
    const existing = await prisma.tag.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return Boolean(existing);
  });
}

function parseCategoryForm(formData: FormData) {
  return categoryFormSchema.parse({
    name: formData.get('name'),
    slug: formData.get('slug') || '',
    description: formData.get('description') || '',
    parentId: formData.get('parentId') || '',
    sortOrder: formData.get('sortOrder') || '0',
  });
}

function parseTagForm(formData: FormData) {
  return tagFormSchema.parse({
    name: formData.get('name'),
    slug: formData.get('slug') || '',
  });
}

export async function createCategory(formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CATEGORY_MANAGE);
  const parsed = parseCategoryForm(formData);
  const slug = await uniqueCategorySlug(parsed.name, parsed.slug);

  if (parsed.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parsed.parentId } });
    if (!parent) throw new Error('دسته والد یافت نشد');
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.name,
      slug,
      description: parsed.description || null,
      parentId: parsed.parentId || null,
      sortOrder: parsed.sortOrder,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'Category',
    entityId: category.id,
    changes: { name: parsed.name, slug },
  });

  revalidatePath('/content/categories');
  await revalidateWeb({ tags: ['categories'], paths: ['/sitemap.xml'] });
}

export async function updateCategory(id: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CATEGORY_MANAGE);
  const parsed = parseCategoryForm(formData);

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new Error('دسته یافت نشد');

  if (parsed.parentId === id) throw new Error('دسته نمی‌تواند والد خودش باشد');

  if (parsed.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parsed.parentId } });
    if (!parent) throw new Error('دسته والد یافت نشد');
  }

  const slug = await uniqueCategorySlug(parsed.name, parsed.slug, id);

  await prisma.category.update({
    where: { id },
    data: {
      name: parsed.name,
      slug,
      description: parsed.description || null,
      parentId: parsed.parentId || null,
      sortOrder: parsed.sortOrder,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Category',
    entityId: id,
    changes: { name: parsed.name, slug },
  });

  revalidatePath('/content/categories');
  await revalidateWeb({ tags: ['categories'], paths: ['/sitemap.xml'] });
}

export async function deleteCategory(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CATEGORY_MANAGE);

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { articles: true, children: true } } },
  });
  if (!category) throw new Error('دسته یافت نشد');

  if (category._count.articles > 0) {
    throw new Error('این دسته دارای مقاله است و قابل حذف نیست');
  }
  if (category._count.children > 0) {
    throw new Error('ابتدا زیردسته‌های این دسته را حذف یا منتقل کنید');
  }

  await prisma.category.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'Category',
    entityId: id,
    changes: { name: category.name },
  });

  revalidatePath('/content/categories');
  await revalidateWeb({ tags: ['categories'], paths: ['/sitemap.xml'] });
}

export async function createTag(formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CATEGORY_MANAGE);
  const parsed = parseTagForm(formData);
  const slug = await uniqueTagSlug(parsed.name, parsed.slug);

  const tag = await prisma.tag.create({ data: { name: parsed.name, slug } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'Tag',
    entityId: tag.id,
    changes: { name: parsed.name, slug },
  });

  revalidatePath('/content/categories');
}

export async function updateTag(id: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CATEGORY_MANAGE);
  const parsed = parseTagForm(formData);

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) throw new Error('برچسب یافت نشد');

  const slug = await uniqueTagSlug(parsed.name, parsed.slug, id);

  await prisma.tag.update({
    where: { id },
    data: { name: parsed.name, slug },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Tag',
    entityId: id,
    changes: { name: parsed.name, slug },
  });

  revalidatePath('/content/categories');
}

export async function deleteTag(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.CATEGORY_MANAGE);

  const tag = await prisma.tag.findUnique({
    where: { id },
    include: { _count: { select: { articles: true } } },
  });
  if (!tag) throw new Error('برچسب یافت نشد');

  if (tag._count.articles > 0) {
    throw new Error('این برچسب به مقالات متصل است و قابل حذف نیست');
  }

  await prisma.tag.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'Tag',
    entityId: id,
    changes: { name: tag.name },
  });

  revalidatePath('/content/categories');
}
