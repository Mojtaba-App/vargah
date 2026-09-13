import type { PrismaClient } from '@prisma/client';

export type SeedUsers = {
  admin: { id: string; email: string | null };
  editor: { id: string; email: string | null };
  writer: { id: string; email: string | null };
};

export type SeedContext = {
  prisma: PrismaClient;
};

export const SEED_MODULES = [
  'users',
  'taxonomy',
  'content',
  'crm',
  'templates',
  'messages',
  'analytics',
  'geo',
  'settings',
] as const;

export type SeedModule = (typeof SEED_MODULES)[number];

export function parseSeedModules(argv: string[]): SeedModule[] | 'all' {
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  if (!onlyArg) return 'all';

  const raw = onlyArg.slice('--only='.length);
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const invalid = parts.filter((p) => !SEED_MODULES.includes(p as SeedModule));
  if (invalid.length > 0) {
    throw new Error(`ماژول seed نامعتبر: ${invalid.join(', ')} — مجاز: ${SEED_MODULES.join(', ')}`);
  }

  return parts as SeedModule[];
}

export function shouldRun(modules: SeedModule[] | 'all', name: SeedModule) {
  return modules === 'all' || modules.includes(name);
}
