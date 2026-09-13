import type { SeedContext } from './types';

export async function seedAnalytics({ prisma }: SeedContext) {
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    await prisma.trafficStat.upsert({
      where: { date },
      update: {},
      create: {
        date,
        pageViews: 1200 + Math.floor(Math.random() * 800),
        visitors: 400 + Math.floor(Math.random() * 200),
      },
    });
  }

  console.log('   📊 analytics — آمار ترافیک ۷ روز');
}
