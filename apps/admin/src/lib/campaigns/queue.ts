import {
  BulkCampaignStatus,
  NotificationChannel,
  NotificationStatus,
  Prisma,
  prisma,
} from '@vargah/database';
import { enqueueJob, JOB_TYPES } from '@vargah/business/job-queue';

import { getMessagingConfig } from '@/lib/messaging-config';
import { sendEmail } from '@/lib/messaging/email';
import { sendSms } from '@/lib/messaging/sms';
import { renderTemplate } from '@/lib/communications/templates';

const DEFAULT_BATCH = Number(process.env.JOB_BATCH_SIZE || 40);
const MAX_BATCH = 100;

function clampBatchSize(batchSize: number): number {
  if (!Number.isFinite(batchSize)) return Math.min(DEFAULT_BATCH, MAX_BATCH);
  return Math.min(MAX_BATCH, Math.max(1, Math.floor(batchSize)));
}

async function deliverOne(
  channel: NotificationChannel,
  recipient: string,
  subject: string | undefined,
  body: string,
) {
  const messaging = await getMessagingConfig();

  if (channel === NotificationChannel.EMAIL) {
    if (!messaging.email.enabled && !process.env.SMTP_HOST) {
      throw new Error('ارسال ایمیل فعال نیست. تنظیمات پیام‌رسانی را بررسی کنید.');
    }
    if (messaging.email.enabled) {
      await sendEmail({
        config: messaging.email,
        to: recipient,
        subject: subject ?? 'پیام وارگه',
        text: body,
      });
    }
    return;
  }

  if (channel === NotificationChannel.SMS) {
    if (!messaging.sms.enabled && !process.env.SMS_API_URL) {
      throw new Error('ارسال پیامک فعال نیست. تنظیمات پیام‌رسانی را بررسی کنید.');
    }
    if (messaging.sms.enabled) {
      await sendSms({
        config: messaging.sms,
        to: recipient,
        message: body,
      });
    }
  }
}

/** صف‌بندی تحویل گیرندگان — ارسال واقعی در worker جاب‌ها */
export async function processCampaignBatch(campaignId: string, batchSize = DEFAULT_BATCH) {
  const safeBatch = clampBatchSize(batchSize);
  const campaign = await prisma.bulkCampaign.findUnique({
    where: { id: campaignId },
    include: { template: true },
  });

  if (!campaign) {
    throw new Error('کمپین یافت نشد');
  }

  if (
    campaign.status !== BulkCampaignStatus.QUEUED &&
    campaign.status !== BulkCampaignStatus.SENDING
  ) {
    throw new Error('این کمپین در صف ارسال نیست');
  }

  if (campaign.scheduledAt && campaign.scheduledAt > new Date()) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      remaining: campaign.totalCount - campaign.sentCount - campaign.failedCount,
      done: false,
      deferred: true as const,
      enqueued: 0,
    };
  }

  await prisma.bulkCampaign.update({
    where: { id: campaignId },
    data: {
      status: BulkCampaignStatus.SENDING,
      startedAt: campaign.startedAt ?? new Date(),
    },
  });

  const pending = await prisma.bulkCampaignRecipient.findMany({
    where: { campaignId, status: NotificationStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: safeBatch,
  });

  let enqueued = 0;
  for (const row of pending) {
    await enqueueJob(
      JOB_TYPES.CAMPAIGN_DELIVER,
      { campaignId, recipientId: row.id },
      { idempotencyKey: `campaign.deliver:${row.id}` },
    );
    enqueued += 1;
  }

  const remaining = await prisma.bulkCampaignRecipient.count({
    where: { campaignId, status: NotificationStatus.PENDING },
  });

  return {
    processed: pending.length,
    sent: 0,
    failed: 0,
    remaining,
    done: remaining === 0 && enqueued === 0,
    deferred: false as const,
    enqueued,
  };
}

export async function deliverCampaignRecipient(campaignId: string, recipientId: string) {
  const campaign = await prisma.bulkCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error('کمپین یافت نشد');

  const row = await prisma.bulkCampaignRecipient.findFirst({
    where: { id: recipientId, campaignId },
  });
  if (!row) throw new Error('گیرنده یافت نشد');
  if (row.status !== NotificationStatus.PENDING) {
    return { skipped: true as const };
  }

  const body = renderTemplate(campaign.body, {
    name: row.name ?? '',
    recipient: row.recipient,
  });
  const subject = campaign.subject
    ? renderTemplate(campaign.subject, {
        name: row.name ?? '',
        recipient: row.recipient,
      })
    : undefined;

  try {
    const notification = await prisma.notification.create({
      data: {
        channel: campaign.channel,
        recipient: row.recipient,
        subject,
        body,
        templateId: campaign.templateId ?? undefined,
        relatedEntity: 'BulkCampaign',
        relatedEntityId: campaign.id,
        status: NotificationStatus.PENDING,
        scheduledAt: new Date(),
        metadata: {
          campaignId: campaign.id,
          recipientId: row.id,
        } as Prisma.InputJsonValue,
      },
    });

    await deliverOne(campaign.channel, row.recipient, subject, body);

    await prisma.$transaction([
      prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      }),
      prisma.bulkCampaignRecipient.update({
        where: { id: row.id },
        data: {
          status: NotificationStatus.SENT,
          notificationId: notification.id,
          sentAt: new Date(),
          errorMessage: null,
        },
      }),
      prisma.bulkCampaign.update({
        where: { id: campaignId },
        data: { sentCount: { increment: 1 } },
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطای ارسال';
    await prisma.$transaction([
      prisma.bulkCampaignRecipient.update({
        where: { id: row.id },
        data: {
          status: NotificationStatus.FAILED,
          errorMessage: message.slice(0, 500),
        },
      }),
      prisma.bulkCampaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      }),
    ]);
    throw error;
  }

  const remaining = await prisma.bulkCampaignRecipient.count({
    where: { campaignId, status: NotificationStatus.PENDING },
  });

  if (remaining === 0) {
    await prisma.bulkCampaign.update({
      where: { id: campaignId },
      data: {
        status: BulkCampaignStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  return { skipped: false as const };
}

export async function processQueuedCampaigns(limit = 3, batchSize = DEFAULT_BATCH) {
  const now = new Date();
  const campaigns = await prisma.bulkCampaign.findMany({
    where: {
      status: { in: [BulkCampaignStatus.QUEUED, BulkCampaignStatus.SENDING] },
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    take: limit,
    select: { id: true },
  });

  const results = [];
  for (const campaign of campaigns) {
    results.push({
      campaignId: campaign.id,
      ...(await processCampaignBatch(campaign.id, batchSize)),
    });
  }
  return results;
}
