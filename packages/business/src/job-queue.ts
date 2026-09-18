import { BackgroundJobStatus, prisma, type Prisma } from '@vargah/database';

export const JOB_TYPES = {
  EMAIL_SEND: 'email.send',
  SMS_SEND: 'sms.send',
  CAMPAIGN_DELIVER: 'campaign.deliver',
  CAMPAIGN_SWEEP: 'campaign.sweep',
  REMINDER_SCAN: 'reminder.scan',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

type EnqueueOptions = {
  runAfter?: Date;
  maxAttempts?: number;
  /** جلوگیری از enqueue تکراری وقتی job هم‌نوع با همین کلید هنوز باز است */
  idempotencyKey?: string;
};

export async function enqueueJob(
  type: JobType | string,
  payload: Record<string, unknown>,
  options: EnqueueOptions = {},
) {
  const body = options.idempotencyKey
    ? { ...payload, idempotencyKey: options.idempotencyKey }
    : payload;

  if (options.idempotencyKey) {
    const existing = await prisma.backgroundJob.findFirst({
      where: {
        type,
        status: { in: [BackgroundJobStatus.PENDING, BackgroundJobStatus.RUNNING] },
        payload: {
          path: ['idempotencyKey'],
          equals: options.idempotencyKey,
        },
      },
      select: { id: true },
    });
    if (existing) return existing;
  }

  return prisma.backgroundJob.create({
    data: {
      type,
      payload: body as Prisma.InputJsonValue,
      runAfter: options.runAfter ?? new Date(),
      maxAttempts: options.maxAttempts ?? 5,
      status: BackgroundJobStatus.PENDING,
    },
  });
}

export async function enqueueJobs(
  items: Array<{
    type: JobType | string;
    payload: Record<string, unknown>;
    options?: EnqueueOptions;
  }>,
) {
  const created = [];
  for (const item of items) {
    created.push(await enqueueJob(item.type, item.payload, item.options));
  }
  return created;
}

/**
 * Claim تا N جاب PENDING که runAfter گذشته — با قفل خوش‌بینانه.
 */
export async function claimJobs(workerId: string, limit = 20) {
  const now = new Date();
  const candidates = await prisma.backgroundJob.findMany({
    where: {
      status: BackgroundJobStatus.PENDING,
      runAfter: { lte: now },
    },
    orderBy: [{ runAfter: 'asc' }, { createdAt: 'asc' }],
    take: limit,
  });

  const claimed = [];
  for (const job of candidates) {
    const updated = await prisma.backgroundJob.updateMany({
      where: {
        id: job.id,
        status: BackgroundJobStatus.PENDING,
      },
      data: {
        status: BackgroundJobStatus.RUNNING,
        lockedAt: now,
        lockedBy: workerId,
        attempts: { increment: 1 },
      },
    });
    if (updated.count === 1) {
      claimed.push(await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } }));
    }
  }
  return claimed;
}

export async function completeJob(jobId: string) {
  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: BackgroundJobStatus.COMPLETED,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
}

export async function failJob(jobId: string, error: string, backoffMs = 60_000) {
  const job = await prisma.backgroundJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  const dead = job.attempts >= job.maxAttempts;
  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: dead ? BackgroundJobStatus.DEAD : BackgroundJobStatus.PENDING,
      lockedAt: null,
      lockedBy: null,
      lastError: error.slice(0, 2000),
      runAfter: dead ? job.runAfter : new Date(Date.now() + backoffMs * Math.max(1, job.attempts)),
    },
  });
}

export async function releaseStaleLocks(staleMs = 15 * 60 * 1000) {
  const cutoff = new Date(Date.now() - staleMs);
  await prisma.backgroundJob.updateMany({
    where: {
      status: BackgroundJobStatus.RUNNING,
      lockedAt: { lt: cutoff },
    },
    data: {
      status: BackgroundJobStatus.PENDING,
      lockedAt: null,
      lockedBy: null,
    },
  });
}
