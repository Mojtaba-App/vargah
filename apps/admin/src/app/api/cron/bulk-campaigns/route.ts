import { NextRequest, NextResponse } from 'next/server';

import { processQueuedCampaigns } from '@/lib/campaigns/queue';
import { processBackgroundJobs } from '@/lib/jobs/processor';

/** Cron — Authorization: Bearer $CRON_SECRET */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await processQueuedCampaigns(5, Number(process.env.JOB_BATCH_SIZE || 50));
  const jobs = await processBackgroundJobs(Number(process.env.JOB_WORKER_CONCURRENCY || 5));
  return NextResponse.json({
    ok: true,
    processedCampaigns: results.length,
    results,
    jobs,
  });
}
