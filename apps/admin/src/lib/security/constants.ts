export const SessionStatus = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];
export type SessionStatusFilter = SessionStatus | 'ALL';

export const LoginResult = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;

export type LoginResult = (typeof LoginResult)[keyof typeof LoginResult];
export type LoginResultFilter = LoginResult | 'ALL';

export const SecurityTab = {
  OVERVIEW: 'OVERVIEW',
  TWO_FACTOR: 'TWO_FACTOR',
  SESSIONS: 'SESSIONS',
  LOGINS: 'LOGINS',
} as const;

export type SecurityTab = (typeof SecurityTab)[keyof typeof SecurityTab];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  ACTIVE: 'فعال',
  REVOKED: 'لغو شده',
  EXPIRED: 'منقضی',
};

export const SESSION_STATUS_VARIANT: Record<
  SessionStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  ACTIVE: 'default',
  REVOKED: 'destructive',
  EXPIRED: 'outline',
};

export const LOGIN_RESULT_LABELS: Record<LoginResult, string> = {
  SUCCESS: 'موفق',
  FAILED: 'ناموفق',
};

export const LOGIN_RESULT_VARIANT: Record<
  LoginResult,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  SUCCESS: 'default',
  FAILED: 'destructive',
};

export const SECURITY_TAB_LABELS: Record<SecurityTab, string> = {
  OVERVIEW: 'نمای کلی',
  TWO_FACTOR: 'تأیید پیامکی',
  SESSIONS: 'نشست‌ها',
  LOGINS: 'لاگ ورود',
};

export function getSessionStatus(
  session: { revokedAt: Date | string | null; expiresAt: Date | string },
  now: Date = new Date(),
): SessionStatus {
  if (session.revokedAt) return SessionStatus.REVOKED;
  const expires =
    session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
  if (expires <= now) return SessionStatus.EXPIRED;
  return SessionStatus.ACTIVE;
}

export function isSessionActive(
  session: { revokedAt: Date | string | null; expiresAt: Date | string },
  now: Date = new Date(),
): boolean {
  return getSessionStatus(session, now) === SessionStatus.ACTIVE;
}
