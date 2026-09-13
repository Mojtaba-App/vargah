import { prisma, type AuditAction, type Prisma } from '@vargah/database';

import { getClientIp, getUserAgent } from '@/lib/security/request';

export type RecordAuditInput = {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  changes?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordAuditLog(input: RecordAuditInput) {
  const [ipAddress, userAgent] = await Promise.all([
    input.ipAddress !== undefined ? Promise.resolve(input.ipAddress) : getClientIp(),
    input.userAgent !== undefined ? Promise.resolve(input.userAgent) : getUserAgent(),
  ]);

  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      changes: input.changes,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    },
  });
}
