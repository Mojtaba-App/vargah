import { NextRequest, NextResponse } from 'next/server';

import { processBackgroundJobs } from '@/lib/jobs/processor';
import { processQueuedCampaigns } from '@/lib/campaigns/queue';
import { enqueueJob, JOB_TYPES } from '@vargah/business/job-queue';

/** Cron — Authorization: Bearer $CRON_SECRET — sweep کمپین + پردازش صف */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const campaigns = await processQueuedCampaigns(5, Number(process.env.JOB_BATCH_SIZE || 40));
  await enqueueJob(JOB_TYPES.REMINDER_SCAN, {}, {
    idempotencyKey: `reminder.scan:${new Date().toISOString().slice(0, 13)}`,
  }).catch(() => undefined);

  const jobs = await processBackgroundJobs(Number(process.env.JOB_WORKER_CONCURRENCY || 5));

  return NextResponse.json({
    ok: true,
    campaigns,
    jobs,
  });
}
