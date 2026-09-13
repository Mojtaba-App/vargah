/** Rate limiting درون‌حافظه‌ای و مبتنی بر دیتابیس با افزایش اتمیک شمارنده */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

type Bucket = { count: number; resetAt: number };

const memoryStore = new Map<string, Bucket>();

/** Rate limiting درون‌حافظه‌ای — برای dev و fallback */
export function checkRateLimitMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = memoryStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = new Date(now + windowMs);
    memoryStore.set(key, { count: 1, resetAt: resetAt.getTime() });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: new Date(bucket.resetAt) };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: new Date(bucket.resetAt) };
}

export type RateLimitStore = {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
};

type PrismaRateLimitClient = {
  $executeRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<number>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
};

/**
 * Rate limiting مبتنی بر دیتابیس با upsert اتمیک در PostgreSQL
 * تا درخواست‌های همزمان از سقف عبور نکنند.
 */
export function createDbRateLimitStore(prisma: PrismaRateLimitClient): RateLimitStore {
  return {
    async check(key, limit, windowMs) {
      const resetAt = new Date(Date.now() + windowMs);

      await prisma.$executeRaw`
        INSERT INTO rate_limit_buckets (key, count, "resetAt")
        VALUES (${key}, 1, ${resetAt})
        ON CONFLICT (key) DO UPDATE
        SET
          count = CASE
            WHEN rate_limit_buckets."resetAt" <= NOW() THEN 1
            WHEN rate_limit_buckets.count < ${limit} THEN rate_limit_buckets.count + 1
            ELSE rate_limit_buckets.count
          END,
          "resetAt" = CASE
            WHEN rate_limit_buckets."resetAt" <= NOW() THEN ${resetAt}
            ELSE rate_limit_buckets."resetAt"
          END
      `;

      const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
        SELECT count, "resetAt" FROM rate_limit_buckets WHERE key = ${key} LIMIT 1
      `;
      const row = rows[0];
      if (!row) {
        return { allowed: true, remaining: limit - 1, resetAt };
      }

      const allowed = row.count <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - row.count),
        resetAt: row.resetAt,
      };
    },
  };
}

export async function assertRateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const result = await store.check(key, limit, windowMs);
  if (!result.allowed) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }
}
