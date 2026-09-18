import { prisma } from '@vargah/database';
import { ADMIN_LOGIN_FAIL_LIMIT, ADMIN_LOGIN_LOCKOUT_MS } from '@vargah/security/admin-login';

import { rateLimitStore } from './rate-limit';

function failKey(identifier: string): string {
  return `admin-login-fail:${identifier}`;
}

export async function assertAdminLoginNotLocked(identifier: string): Promise<void> {
  const key = failKey(identifier);
  const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });
  if (!existing) return;

  const now = new Date();
  if (existing.resetAt <= now) return;

  if (existing.count >= ADMIN_LOGIN_FAIL_LIMIT) {
    throw new AdminLoginLockedError(existing.resetAt);
  }
}

export async function recordAdminLoginFailure(identifier: string): Promise<{
  locked: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
}> {
  const result = await rateLimitStore.check(
    failKey(identifier),
    ADMIN_LOGIN_FAIL_LIMIT,
    ADMIN_LOGIN_LOCKOUT_MS,
  );

  const locked = !result.allowed;

  return {
    locked,
    remainingAttempts: locked ? 0 : result.remaining,
    lockedUntil: locked ? result.resetAt : undefined,
  };
}

export async function clearAdminLoginFailures(identifier: string): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({ where: { key: failKey(identifier) } });
}

export class AdminLoginLockedError extends Error {
  readonly lockedUntil: Date;

  constructor(lockedUntil: Date) {
    super('ACCOUNT_LOCKED');
    this.name = 'AdminLoginLockedError';
    this.lockedUntil = lockedUntil;
  }
}
