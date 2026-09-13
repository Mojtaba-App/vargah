import { generateSecret, generateURI, verifySync } from 'otplib';

export function generateTwoFactorSecret(): string {
  return generateSecret();
}

export function getTwoFactorUri(secret: string, email: string, issuer = 'وارگه'): string {
  return generateURI({ issuer, label: email, secret });
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    const result = verifySync({ secret, token });
    return result.valid;
  } catch {
    return false;
  }
}
