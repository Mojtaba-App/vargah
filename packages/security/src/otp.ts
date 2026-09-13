import { randomInt } from 'crypto';

export const OTP_EXPIRY_MS = 2 * 60 * 1000; // ۲ دقیقه
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RATE_LIMIT = 5;
export const OTP_RATE_WINDOW_MS = 15 * 60 * 1000;

export function generateOtpCode(length = 6): string {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, '0');
}

export function isOtpExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
