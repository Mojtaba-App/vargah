import { PrismaClient } from '@prisma/client';

import { runSeed } from './seeds';

const prisma = new PrismaClient();

runSeed(prisma)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
