import { NextRequest, NextResponse } from 'next/server';

import { enqueueJob, JOB_TYPES } from '@vargah/business/job-queue';
import { processBackgroundJobs } from '@/lib/jobs/processor';

/** Cron — صف یادآورها را enqueue می‌کند سپس worker را اجرا می‌کند */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hourKey = new Date().toISOString().slice(0, 13);
  await enqueueJob(JOB_TYPES.REMINDER_SCAN, {}, { idempotencyKey: `reminder.scan:${hourKey}` });
  const jobs = await processBackgroundJobs(Number(process.env.JOB_WORKER_CONCURRENCY || 5));
  return NextResponse.json({ ok: true, jobs });
}
