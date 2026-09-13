import { prisma } from '@vargah/database';
import { sendSms } from '@vargah/business/sms';
import {
  generateOtpCode,
  isOtpExpired,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RATE_LIMIT,
  OTP_RATE_WINDOW_MS,
} from '@vargah/security/otp';
import { isOtpSandboxAllowed } from '@vargah/security/otp-sandbox';
import { constantTimeEqualString } from '@vargah/security/secrets';
import { hashToken } from '@vargah/security/tokens';

import { getMessagingConfig } from '@/lib/messaging-config';
import { rateLimitOrThrow } from './rate-limit';

const OTP_IP_LIMIT = 20;
const OTP_IP_WINDOW_MS = 15 * 60 * 1000;

function otpCodeMatches(stored: string, incoming: string): boolean {
  const incomingHash = hashToken(incoming);
  if (stored.length === 64 && /^[a-f0-9]+$/i.test(stored)) {
    return constantTimeEqualString(stored, incomingHash);
  }
  return constantTimeEqualString(stored, incoming);
}

export async function createPhoneOtp(phone: string, clientIp?: string | null) {
  await rateLimitOrThrow(`otp:${phone}`, OTP_RATE_LIMIT, OTP_RATE_WINDOW_MS);
  // fail-closed: بدون IP هم با باکت sentinel محدود می‌شود
  await rateLimitOrThrow(`otp-ip:${clientIp?.trim() || 'unknown'}`, OTP_IP_LIMIT, OTP_IP_WINDOW_MS);

  await prisma.otpCode.updateMany({
    where: { phone, used: false },
    data: { used: true },
  });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await prisma.otpCode.create({
    data: { phone, code: hashToken(code), expiresAt },
  });

  const sandboxMode = isOtpSandboxAllowed(['ADMIN_OTP_SANDBOX', 'CUSTOMER_OTP_SANDBOX']);

  if (sandboxMode) {
    console.info(`[Admin OTP / Sandbox] ${phone} → ${code} (expires ${expiresAt.toISOString()})`);
  } else {
    const messaging = await getMessagingConfig();
    if (!messaging.sms.enabled) {
      throw new Error('ارسال پیامک پیکربندی نشده است. تنظیمات پیام‌رسانی را کامل کنید.');
    }
    await sendSms({
      config: messaging.sms,
      to: phone,
      message: `کد ورود پنل وارگه: ${code}\nاین کد تا ۲ دقیقه معتبر است.`,
    });
  }

  return {
    expiresAt,
    sandboxMode,
    devCode: sandboxMode ? code : undefined,
  };
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return false;

  if (otp.attemptCount >= OTP_MAX_ATTEMPTS) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    return false;
  }

  if (isOtpExpired(otp.expiresAt)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    return false;
  }

  if (!otpCodeMatches(otp.code, code)) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attemptCount: { increment: 1 } },
    });
    return false;
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
  return true;
}
