import { NextResponse } from 'next/server';
import { prisma } from '@vargah/database';
import { rateLimitOrThrow } from '@/lib/rate-limit';

function isDatabaseReady() {
  return Boolean(process.env.DATABASE_URL);
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon';

    if (isDatabaseReady()) {
      await rateLimitOrThrow(`analytics:${ip}`, 120, 60_000);
    }

    const raw = await request.json();
    const path = typeof raw.path === 'string' ? raw.path.slice(0, 500) : '';
    if (!path || !path.startsWith('/')) {
      return NextResponse.json({ error: 'INVALID' }, { status: 400 });
    }

    if (!isDatabaseReady()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    const articleId = typeof raw.articleId === 'string' ? raw.articleId : undefined;
    if (articleId) {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true },
      });
      if (!article) {
        return NextResponse.json({ error: 'INVALID_ARTICLE' }, { status: 400 });
      }
    }

    const referrer = typeof raw.referrer === 'string' ? raw.referrer.slice(0, 500) : undefined;
    const source = typeof raw.source === 'string' ? raw.source.slice(0, 50) : 'direct';

    await prisma.pageView.create({
      data: {
        path,
        articleId,
        referrer,
        source,
        userAgent: request.headers.get('user-agent')?.slice(0, 300),
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.trafficStat.upsert({
      where: { date: today },
      create: { date: today, pageViews: 1, visitors: 1 },
      update: { pageViews: { increment: 1 } },
    });

    return NextResponse.json({ ok: true, persisted: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      return NextResponse.json({ error: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ error: 'INVALID' }, { status: 400 });
  }
}
