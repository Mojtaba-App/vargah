import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuditAction, prisma, UserStatus } from '@vargah/database';
import { loginSchema } from '@vargah/security/schemas';
import { verifyPassword } from '@vargah/security/password';
import { maskPhone, normalizeAdminLoginIdentifier } from '@vargah/security/phone';
import { verifyTwoFactorToken } from '@vargah/security/two-factor';

import { recordAuditLog } from '@/lib/audit/record';
import { canAccessAdmin } from '@/lib/permissions';
import { getClientIp, getUserAgent } from '@/lib/security/request';
import { adminApiPath } from '@/lib/base-path';
import { createRefreshTokenSession, REFRESH_COOKIE } from '@/lib/security/refresh-token';
import { setSessionCookie } from '@/lib/session-token';
import { createPhoneOtp, verifyPhoneOtp } from '@/lib/security/otp-service';
import {
  assertAdminLoginNotLocked,
  AdminLoginLockedError,
  clearAdminLoginFailures,
  recordAdminLoginFailure,
} from '@/lib/security/login-lockout';
import {
  clearLoginChallengeCookie,
  readLoginChallengeCookie,
  setLoginChallengeCookie,
} from '@/lib/security/login-challenge';

async function completeAdminLogin(userId: string, email: string | null, ip: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash || user.status !== UserStatus.ACTIVE || !canAccessAdmin(user.role)) {
    throw new Error('INVALID_SESSION');
  }

  const ua = await getUserAgent();
  const { rawToken } = await createRefreshTokenSession(user.id, ip, ua);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await prisma.loginAttempt.create({
    data: { userId: user.id, email: user.email, ipAddress: ip, success: true },
  });
  await recordAuditLog({
    userId: user.id,
    action: AuditAction.LOGIN,
    entity: 'User',
    entityId: user.id,
    ipAddress: ip,
    userAgent: ua,
  });

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'AUTH_SECRET missing' }, { status: 500 });
  }

  await setSessionCookie({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    twoFactorEnabled: user.twoFactorEnabled,
  });

  const isProd = process.env.NODE_ENV === 'production';
  const cookieStore = await cookies();

  cookieStore.set(REFRESH_COOKIE, rawToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: adminApiPath('/api/auth/refresh'),
    maxAge: 7 * 24 * 60 * 60,
  });

  await clearLoginChallengeCookie();

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ip = await getClientIp();

    if (body?.resendSms === true) {
      const challenge = await readLoginChallengeCookie();
      if (!challenge || challenge.smsVerified) {
        return NextResponse.json({ error: 'INVALID_CHALLENGE' }, { status: 401 });
      }

      const otpResult = await createPhoneOtp(challenge.phone, ip);
      return NextResponse.json({
        requiresSmsOtp: true,
        maskedPhone: maskPhone(challenge.phone),
        expiresAt: otpResult.expiresAt.toISOString(),
        sandboxMode: otpResult.sandboxMode,
        devCode: otpResult.devCode,
      });
    }

    const { identifier, password, smsCode, totpCode } = loginSchema.parse(body);

    if (totpCode && !smsCode) {
      const challenge = await readLoginChallengeCookie();
      if (!challenge?.smsVerified) {
        return NextResponse.json({ error: 'INVALID_CHALLENGE' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
      if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        return NextResponse.json({ error: 'TOTP_NOT_ENABLED' }, { status: 400 });
      }

      if (!verifyTwoFactorToken(user.twoFactorSecret, totpCode)) {
        await prisma.loginAttempt.create({
          data: { userId: challenge.userId, ipAddress: ip, success: false },
        });
        return NextResponse.json({ error: 'INVALID_TOTP' }, { status: 401 });
      }

      if (user.email) await clearAdminLoginFailures(user.email);
      if (user.username) await clearAdminLoginFailures(user.username);

      return completeAdminLogin(challenge.userId, user.email ?? null, ip);
    }

    if (smsCode) {
      const challenge = await readLoginChallengeCookie();
      if (!challenge || challenge.smsVerified) {
        return NextResponse.json({ error: 'INVALID_CHALLENGE' }, { status: 401 });
      }

      const validOtp = await verifyPhoneOtp(challenge.phone, smsCode);
      if (!validOtp) {
        await prisma.loginAttempt.create({
          data: { userId: challenge.userId, ipAddress: ip, success: false },
        });
        return NextResponse.json({ error: 'INVALID_SMS_CODE' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
      if (user?.twoFactorEnabled && user.twoFactorSecret) {
        await setLoginChallengeCookie(challenge.userId, challenge.phone, { smsVerified: true });
        return NextResponse.json({ requiresTotp: true });
      }

      if (user?.email) await clearAdminLoginFailures(user.email);
      if (user?.username) await clearAdminLoginFailures(user.username);

      return completeAdminLogin(challenge.userId, user?.email ?? null, ip);
    }

    let loginId: { kind: 'email' | 'username'; value: string };
    try {
      loginId = normalizeAdminLoginIdentifier(identifier!);
    } catch {
      return NextResponse.json({ error: 'INVALID_IDENTIFIER' }, { status: 400 });
    }

    const lockKey = loginId.value;

    try {
      await assertAdminLoginNotLocked(lockKey);
    } catch (error) {
      if (error instanceof AdminLoginLockedError) {
        return NextResponse.json(
          {
            error: 'ACCOUNT_LOCKED',
            lockedUntil: error.lockedUntil.toISOString(),
          },
          { status: 429 },
        );
      }
      throw error;
    }

    const user =
      loginId.kind === 'email'
        ? await prisma.user.findUnique({ where: { email: loginId.value } })
        : await prisma.user.findUnique({ where: { username: loginId.value } });

    const auditEmail = user?.email ?? (loginId.kind === 'email' ? loginId.value : null);

    if (!user?.passwordHash || user.status !== UserStatus.ACTIVE || !canAccessAdmin(user.role)) {
      await recordAdminLoginFailure(lockKey);
      await prisma.loginAttempt.create({
        data: { email: auditEmail, ipAddress: ip, success: false },
      });
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    }

    if (!password) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      const failure = await recordAdminLoginFailure(lockKey);
      await prisma.loginAttempt.create({
        data: { userId: user.id, email: auditEmail, ipAddress: ip, success: false },
      });

      if (failure.locked) {
        return NextResponse.json(
          {
            error: 'ACCOUNT_LOCKED',
            lockedUntil: failure.lockedUntil?.toISOString(),
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: 'INVALID_CREDENTIALS',
          remainingAttempts: failure.remainingAttempts,
        },
        { status: 401 },
      );
    }

    if (!user.phone) {
      return NextResponse.json({ error: 'PHONE_NOT_REGISTERED' }, { status: 403 });
    }

    const otpResult = await createPhoneOtp(user.phone, ip);
    await setLoginChallengeCookie(user.id, user.phone);

    return NextResponse.json({
      requiresSmsOtp: true,
      requiresTotp: Boolean(user.twoFactorEnabled && user.twoFactorSecret),
      maskedPhone: maskPhone(user.phone),
      expiresAt: otpResult.expiresAt.toISOString(),
      sandboxMode: otpResult.sandboxMode,
      devCode: otpResult.devCode,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      return NextResponse.json({ error: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ error: 'LOGIN_FAILED' }, { status: 400 });
  }
}
