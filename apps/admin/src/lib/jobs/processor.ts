import { randomBytes } from 'node:crypto';

import {
  claimJobs,
  completeJob,
  failJob,
  JOB_TYPES,
  releaseStaleLocks,
  enqueueJob,
} from '@vargah/business/job-queue';
import { BackgroundJobStatus, NotificationChannel, prisma } from '@vargah/database';

import { deliverCampaignRecipient, processQueuedCampaigns } from '@/lib/campaigns/queue';
import { runAllReminders } from '@/lib/communications/reminders';
import { getMessagingConfig } from '@/lib/messaging-config';
import { sendEmail } from '@/lib/messaging/email';
import { sendSms } from '@/lib/messaging/sms';

function workerId() {
  return `admin-${process.pid}-${randomBytes(3).toString('hex')}`;
}

async function handleEmailSend(payload: Record<string, unknown>) {
  const to = String(payload.to ?? '');
  const subject = String(payload.subject ?? 'پیام وارگه');
  const text = String(payload.body ?? payload.text ?? '');
  if (!to || !text) throw new Error('payload ایمیل ناقص است');

  const messaging = await getMessagingConfig();
  if (!messaging.email.enabled) throw new Error('ایمیل غیرفعال است');
  await sendEmail({ config: messaging.email, to, subject, text });
}

async function handleSmsSend(payload: Record<string, unknown>) {
  const to = String(payload.to ?? '');
  const message = String(payload.body ?? payload.message ?? '');
  if (!to || !message) throw new Error('payload پیامک ناقص است');

  const messaging = await getMessagingConfig();
  if (!messaging.sms.enabled) throw new Error('پیامک غیرفعال است');
  await sendSms({ config: messaging.sms, to, message });
}

async function handleJob(type: string, payload: Record<string, unknown>) {
  switch (type) {
    case JOB_TYPES.EMAIL_SEND:
      await handleEmailSend(payload);
      return;
    case JOB_TYPES.SMS_SEND:
      await handleSmsSend(payload);
      return;
    case JOB_TYPES.CAMPAIGN_DELIVER: {
      const campaignId = String(payload.campaignId ?? '');
      const recipientId = String(payload.recipientId ?? '');
      await deliverCampaignRecipient(campaignId, recipientId);
      return;
    }
    case JOB_TYPES.CAMPAIGN_SWEEP:
      await processQueuedCampaigns(5, Number(process.env.JOB_BATCH_SIZE || 40));
      return;
    case JOB_TYPES.REMINDER_SCAN:
      await runAllReminders();
      return;
    default:
      throw new Error(`نوع جاب ناشناخته: ${type}`);
  }
}

export async function processBackgroundJobs(
  limit = Number(process.env.JOB_WORKER_CONCURRENCY || 5),
) {
  await releaseStaleLocks();
  const jobs = await claimJobs(workerId(), limit);
  const results: Array<{ id: string; type: string; ok: boolean; error?: string }> = [];

  for (const job of jobs) {
    const payload = (job.payload ?? {}) as Record<string, unknown>;
    try {
      await handleJob(job.type, payload);
      await completeJob(job.id);
      results.push({ id: job.id, type: job.type, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'job failed';
      await failJob(job.id, message);
      results.push({ id: job.id, type: job.type, ok: false, error: message });
    }
  }

  return { claimed: jobs.length, results };
}

/** enqueue کمکی برای اعلان‌های تکی */
export async function enqueueNotificationDelivery(input: {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  body: string;
}) {
  const type =
    input.channel === NotificationChannel.SMS ? JOB_TYPES.SMS_SEND : JOB_TYPES.EMAIL_SEND;
  return enqueueJob(type, {
    to: input.to,
    subject: input.subject,
    body: input.body,
  });
}

export async function getJobQueueStats() {
  const [pending, running, dead, completed] = await Promise.all([
    prisma.backgroundJob.count({ where: { status: BackgroundJobStatus.PENDING } }),
    prisma.backgroundJob.count({ where: { status: BackgroundJobStatus.RUNNING } }),
    prisma.backgroundJob.count({ where: { status: BackgroundJobStatus.DEAD } }),
    prisma.backgroundJob.count({ where: { status: BackgroundJobStatus.COMPLETED } }),
  ]);
  return { pending, running, dead, completed };
}
