import { NextRequest, NextResponse } from 'next/server';

import { runGeoStatsJob } from '@vargah/business/geo-stats';

/** Cron endpoint — Authorization: Bearer $CRON_SECRET */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await runGeoStatsJob();
  return NextResponse.json({ ok: true, results });
}
