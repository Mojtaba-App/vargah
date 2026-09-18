import { PrismaClient } from '@prisma/client';

import { seedAnalytics } from './analytics';
import { seedContent } from './content';
import { seedCrm } from './crm';
import { seedGeoStats } from './geo-stats';
import { seedIranCities } from './iran-cities';
import { seedMessages } from './messages';
import { seedSettings } from './settings';
import { seedTaxonomy } from './taxonomy';
import { seedTemplates } from './templates';
import { parseSeedModules, shouldRun, type SeedContext, type SeedUsers } from './types';
import { seedUsers } from './users';

export async function runSeed(prisma: PrismaClient, argv: string[] = process.argv.slice(2)) {
  const modules = parseSeedModules(argv);
  const ctx: SeedContext = { prisma };

  console.log('🌱 Seed started');
  if (modules !== 'all') {
    console.log(`   modules: ${modules.join(', ')}`);
  }

  let users: SeedUsers | null = null;

  const needUsers =
    modules === 'all' || modules.some((m) => ['content', 'crm', 'settings'].includes(m));

  if (needUsers) {
    if (shouldRun(modules, 'users')) {
      users = await seedUsers(ctx);
    } else {
      const writer = await prisma.user.findUnique({ where: { email: 'writer@magazine.ir' } });
      const editor = await prisma.user.findUnique({ where: { email: 'editor@magazine.ir' } });
      const admin = await prisma.user.findUnique({ where: { email: 'admin@magazine.ir' } });
      if (!writer || !editor || !admin) {
        throw new Error('برای seed این بخش‌ها ابتدا ماژول users را اجرا کنید: pnpm db:seed:users');
      }
      users = { admin, editor, writer };
    }
  }

  if (shouldRun(modules, 'users') && !users) {
    users = await seedUsers(ctx);
  }

  if (shouldRun(modules, 'taxonomy')) await seedTaxonomy(ctx);
  if (shouldRun(modules, 'content') && users) await seedContent(ctx, users);
  if (shouldRun(modules, 'crm') && users) await seedCrm(ctx, users);
  if (shouldRun(modules, 'geo')) {
    await seedIranCities(ctx);
    await seedGeoStats(ctx);
  }
  if (shouldRun(modules, 'templates')) await seedTemplates(ctx);
  if (shouldRun(modules, 'messages')) await seedMessages(ctx);
  if (shouldRun(modules, 'analytics')) await seedAnalytics(ctx);
  if (shouldRun(modules, 'settings') && users) await seedSettings(ctx, users);

  console.log('✅ Seed completed');
}
