'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { unlink } from 'node:fs/promises';
import path from 'node:path';

import { revalidatePath } from 'next/cache';
import { prisma, AuditAction } from '@vargah/database';

import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { mediaUpdateSchema } from '@/lib/schemas/media-form';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const WEB_UPLOADS = path.resolve(process.cwd(), '../web/public');

function parseUpdateForm(formData: FormData) {
  return mediaUpdateSchema.parse({
    alt: formData.get('alt') || '',
    tags: formData.get('tags') ?? '[]',
  });
}

function resolveFilePathFromUrl(url: string): string | null {
  const pathname = url.split('?')[0];
  if (!pathname.startsWith('/uploads/')) return null;
  const relative = pathname.replace(/^\//, '');
  const resolved = path.resolve(WEB_UPLOADS, relative);
  if (!resolved.startsWith(WEB_UPLOADS)) return null;
  return resolved;
}

export async function updateMediaAsset(id: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  const parsed = parseUpdateForm(formData);

  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) throw new Error('فایل یافت نشد');

  await prisma.mediaAsset.update({
    where: { id },
    data: {
      alt: parsed.alt || null,
      tags: parsed.tags,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'MediaAsset',
    entityId: id,
    changes: { originalName: existing.originalName, tags: parsed.tags },
  });

  revalidatePath('/content/media');
}

export async function deleteMediaAsset(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.MEDIA_MANAGE);

  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw new Error('فایل یافت نشد');

  const filePath = resolveFilePathFromUrl(asset.url);
  if (filePath) {
    try {
      await unlink(filePath);
    } catch {
      // file may already be missing on disk
    }
  }

  await prisma.mediaAsset.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'MediaAsset',
    entityId: id,
    changes: { originalName: asset.originalName, url: asset.url },
  });

  revalidatePath('/content/media');
}
