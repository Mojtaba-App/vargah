import { createHash, randomBytes } from 'crypto';

export { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from './token-constants';

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateTokenFamily(): string {
  return randomBytes(16).toString('hex');
}
