'use server';

import { revalidatePath } from 'next/cache';
import {
  BulkCampaignStatus,
  NotificationChannel,
  NotificationStatus,
  prisma,
  AuditAction,
} from '@vargah/database';
import { z } from 'zod';

import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { recordAuditLog } from '@/lib/audit/record';
import {
  CAMPAIGN_SEGMENTS,
  countAudience,
  listAudience,
  normalizeCampaignFilters,
  resolveRecipientAddress,
  type CampaignAudienceFilters,
} from '@/lib/campaigns/audience';
import { processCampaignBatch } from '@/lib/campaigns/queue';
import { PERMISSIONS } from '@/lib/permissions';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const filtersSchema = z.object({
  segment: z.enum(CAMPAIGN_SEGMENTS).optional(),
  registeredFrom: z.string().optional(),
  registeredTo: z.string().optional(),
  purchasedFrom: z.string().optional(),
  purchasedTo: z.string().optional(),
  planType: z.string().max(80).optional(),
  province: z.string().max(80).optional(),
  cityId: z.string().max(80).optional(),
  search: z.string().max(120).optional(),
});

const createCampaignSchema = z.object({
  title: z.string().trim().min(2, 'عنوان کمپین الزامی است').max(150),
  channel: z.enum(['EMAIL', 'SMS']),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(3, 'متن پیام الزامی است').max(5000),
  templateId: z.string().optional(),
  filters: filtersSchema.default({}),
  scheduledAt: z.string().optional(),
  queueNow: z.boolean().optional(),
});

function revalidateCampaigns(id?: string) {
  revalidatePath('/messages/campaigns');
  if (id) revalidatePath(`/messages/campaigns/${id}`);
}

export async function previewCampaignAudience(
  channel: 'EMAIL' | 'SMS',
  filters: CampaignAudienceFilters,
) {
  await requirePermission(PERMISSIONS.MESSAGE_VIEW);
  const normalized = normalizeCampaignFilters(filters);
  const count = await countAudience(
    prisma,
    channel === 'EMAIL' ? NotificationChannel.EMAIL : NotificationChannel.SMS,
    normalized,
  );
  return { count, filters: normalized };
}

async function enqueueCampaignInternal(campaignId: string, actorId: string) {
  const campaign = await prisma.bulkCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error('کمپین یافت نشد');
  if (
    campaign.status !== BulkCampaignStatus.DRAFT &&
    campaign.status !== BulkCampaignStatus.CANCELLED
  ) {
    throw new Error('فقط کمپین پیش‌نویس یا لغو‌شده قابل صف‌بندی است');
  }

  const filters = normalizeCampaignFilters(campaign.filters);
  const audience = await listAudience(prisma, campaign.channel, filters, 8000);

  const rows = audience
    .map((subscriber) => {
      const recipient = resolveRecipientAddress(campaign.channel, subscriber);
      if (!recipient) return null;
      return {
        campaignId: campaign.id,
        subscriberId: subscriber.id,
        recipient,
        name: subscriber.name,
        status: NotificationStatus.PENDING,
      };
    })
    .filter(Boolean) as Array<{
    campaignId: string;
    subscriberId: string;
    recipient: string;
    name: string;
    status: NotificationStatus;
  }>;

  if (rows.length === 0) {
    throw new Error('با فیلترهای فعلی مخاطبی برای ارسال یافت نشد');
  }

  await prisma.$transaction(async (tx) => {
    await tx.bulkCampaignRecipient.deleteMany({ where: { campaignId } });
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      await tx.bulkCampaignRecipient.createMany({
        data: rows.slice(i, i + chunkSize),
      });
    }
    await tx.bulkCampaign.update({
      where: { id: campaignId },
      data: {
        status: BulkCampaignStatus.QUEUED,
        totalCount: rows.length,
        sentCount: 0,
        failedCount: 0,
        skippedCount: audience.length - rows.length,
        completedAt: null,
        startedAt: null,
      },
    });
  });

  await recordAuditLog({
    userId: actorId,
    action: AuditAction.UPDATE,
    entity: 'BulkCampaign',
    entityId: campaignId,
    changes: { action: 'enqueue', totalCount: rows.length },
  });

  return { totalCount: rows.length };
}

export async function createBulkCampaign(input: unknown) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();
  await requirePermission(PERMISSIONS.MESSAGE_MANAGE);

  const parsed = createCampaignSchema.parse(input);
  if (parsed.channel === 'EMAIL' && !parsed.subject?.trim()) {
    throw new Error('موضوع ایمیل الزامی است');
  }

  const filters = normalizeCampaignFilters(parsed.filters);
  const channel = parsed.channel === 'EMAIL' ? NotificationChannel.EMAIL : NotificationChannel.SMS;

  if (parsed.templateId) {
    const template = await prisma.messageTemplate.findFirst({
      where: { id: parsed.templateId, channel, isActive: true },
      select: { id: true },
    });
    if (!template) throw new Error('قالب انتخاب‌شده معتبر نیست');
  }

  let scheduledAt: Date | null = null;
  if (parsed.scheduledAt?.trim()) {
    const date = new Date(parsed.scheduledAt);
    if (Number.isNaN(date.getTime())) throw new Error('زمان‌بندی نامعتبر است');
    scheduledAt = date;
  }

  const campaign = await prisma.bulkCampaign.create({
    data: {
      title: parsed.title,
      channel,
      subject: parsed.channel === 'EMAIL' ? parsed.subject?.trim() : null,
      body: parsed.body,
      templateId: parsed.templateId || null,
      filters,
      scheduledAt,
      status: BulkCampaignStatus.DRAFT,
      createdById: session.user.id,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'BulkCampaign',
    entityId: campaign.id,
    changes: { title: campaign.title, channel: campaign.channel },
  });

  if (parsed.queueNow) {
    await enqueueCampaignInternal(campaign.id, session.user.id);
    revalidateCampaigns(campaign.id);
    return { id: campaign.id, queued: true as const };
  }

  revalidateCampaigns(campaign.id);
  return { id: campaign.id, queued: false as const };
}

export async function enqueueBulkCampaign(campaignId: string) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();
  await requirePermission(PERMISSIONS.MESSAGE_MANAGE);
  const result = await enqueueCampaignInternal(campaignId, session.user.id);
  revalidateCampaigns(campaignId);
  return result;
}

export async function processBulkCampaignNow(campaignId: string, batchSize = 40) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.MESSAGE_MANAGE);
  const result = await processCampaignBatch(campaignId, batchSize);
  revalidateCampaigns(campaignId);
  return result;
}

export async function cancelBulkCampaign(campaignId: string) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();
  await requirePermission(PERMISSIONS.MESSAGE_MANAGE);

  const campaign = await prisma.bulkCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error('کمپین یافت نشد');
  if (
    campaign.status !== BulkCampaignStatus.QUEUED &&
    campaign.status !== BulkCampaignStatus.SENDING &&
    campaign.status !== BulkCampaignStatus.DRAFT
  ) {
    throw new Error('این کمپین قابل لغو نیست');
  }

  await prisma.$transaction([
    prisma.bulkCampaignRecipient.updateMany({
      where: { campaignId, status: NotificationStatus.PENDING },
      data: { status: NotificationStatus.CANCELLED },
    }),
    prisma.bulkCampaign.update({
      where: { id: campaignId },
      data: {
        status: BulkCampaignStatus.CANCELLED,
        completedAt: new Date(),
      },
    }),
  ]);

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'BulkCampaign',
    entityId: campaignId,
    changes: { action: 'cancel' },
  });

  revalidateCampaigns(campaignId);
  return { ok: true as const };
}

export async function deleteBulkCampaign(campaignId: string) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();
  await requirePermission(PERMISSIONS.MESSAGE_MANAGE);

  const campaign = await prisma.bulkCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error('کمپین یافت نشد');
  if (
    campaign.status === BulkCampaignStatus.SENDING ||
    campaign.status === BulkCampaignStatus.QUEUED
  ) {
    throw new Error('ابتدا کمپین را لغو کنید');
  }

  await prisma.bulkCampaign.delete({ where: { id: campaignId } });
  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'BulkCampaign',
    entityId: campaignId,
    changes: { title: campaign.title },
  });

  revalidateCampaigns();
  return { ok: true as const };
}
