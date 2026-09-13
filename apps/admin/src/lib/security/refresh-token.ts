import { prisma } from '@vargah/database';
import {
  generateSecureToken,
  generateTokenFamily,
  hashToken,
  REFRESH_TOKEN_MAX_AGE,
} from '@vargah/security/tokens';

const REFRESH_COOKIE = 'vargah_refresh_token';

export { REFRESH_COOKIE };

export async function createRefreshTokenSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const rawToken = generateSecureToken();
  const familyId = generateTokenFamily();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000);

  const [refreshToken, session] = await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawToken),
        familyId,
        expiresAt,
      },
    }),
    prisma.userSession.create({
      data: {
        userId,
        sessionToken: familyId,
        ipAddress,
        userAgent,
        expiresAt,
      },
    }),
  ]);

  return { rawToken, refreshToken, session, familyId };
}

/** چرخش Refresh Token — توکن قبلی باطل و توکن جدید صادر می‌شود */
export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    if (existing?.familyId) {
      await prisma.refreshToken.updateMany({
        where: { familyId: existing.familyId },
        data: { revokedAt: new Date() },
      });
    }
    return null;
  }

  const newRaw = generateSecureToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: hashToken(newRaw),
        familyId: existing.familyId,
        expiresAt,
      },
    }),
  ]);

  return {
    newRawToken: newRaw,
    userId: existing.userId,
    role: existing.user.role,
    email: existing.user.email,
    name: existing.user.name,
    avatar: existing.user.avatar,
    twoFactorEnabled: existing.user.twoFactorEnabled,
  };
}

export async function revokeRefreshTokenFamily(familyId: string) {
  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { familyId },
      data: { revokedAt: new Date() },
    }),
    prisma.userSession.updateMany({
      where: { sessionToken: familyId },
      data: { revokedAt: new Date() },
    }),
  ]);
}
