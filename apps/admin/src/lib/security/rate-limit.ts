import { prisma } from '@vargah/database';
import {
  createDbRateLimitStore,
  type RateLimitStore,
} from '@vargah/security/rate-limit';

export const rateLimitStore: RateLimitStore = createDbRateLimitStore(prisma);

export async function rateLimitOrThrow(key: string, limit: number, windowMs: number) {
  const result = await rateLimitStore.check(key, limit, windowMs);
  if (!result.allowed) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }
  return result;
}
