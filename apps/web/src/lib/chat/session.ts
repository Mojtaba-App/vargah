import { cookies } from 'next/headers';
import { generateSecureToken, hashToken } from '@vargah/security/tokens';

export const CHAT_GUEST_COOKIE = 'vargah_chat_guest';
const CHAT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export function createGuestChatToken(): { token: string; tokenHash: string } {
  const token = generateSecureToken(32);
  return { token, tokenHash: hashToken(token) };
}

export function hashGuestChatToken(token: string): string {
  return hashToken(token);
}

export async function getGuestChatToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CHAT_GUEST_COOKIE)?.value?.trim();
  return value || null;
}

export async function setGuestChatCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  cookieStore.set(CHAT_GUEST_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: CHAT_COOKIE_MAX_AGE,
  });
}

export async function clearGuestChatCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CHAT_GUEST_COOKIE);
}
