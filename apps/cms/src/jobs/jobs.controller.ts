import { Controller, Post, UseGuards } from '@nestjs/common';

import { ApiKeyGuard } from '../guards/api-key.guard';

/**
 * Worker نازک: بیدار کردن پردازش صف در پنل ادمین (منبع حقیقت ارسال).
 * ویرایش محتوا همچنان در Next Admin است — CMS نقش read-API + job wake را دارد.
 */
@Controller('jobs')
@UseGuards(ApiKeyGuard)
export class JobsController {
  @Post('process')
  async process() {
    const adminOrigin = (
      process.env.ADMIN_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_ADMIN_URL ||
      'http://127.0.0.1:3001'
    ).replace(/\/$/, '');
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return { ok: false, error: 'CRON_SECRET missing' };
    }

    const basePath = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/admin';
    const url = `${adminOrigin}${basePath.startsWith('/') ? basePath : `/${basePath}`}/api/cron/jobs`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    });

    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  }
}
