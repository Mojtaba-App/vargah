import { getSessionStatus, SessionStatus } from '@/lib/security/constants';

export type SecuritySummary = {
  activeSessions: number;
  revokedSessions: number;
  expiredSessions: number;
  failedLogins24h: number;
  successfulLogins24h: number;
  successfulLoginsToday: number;
  failedLoginsToday: number;
  twoFactorEnabled: number;
  smsPhoneEnabled: number;
  twoFactorTotal: number;
  twoFactorAdoptionPercent: number;
  smsPhoneAdoptionPercent: number;
};

export type DailyLoginPoint = {
  label: string;
  dateKey: string;
  success: number;
  failed: number;
  total: number;
};

type SessionLike = {
  revokedAt: Date | null;
  expiresAt: Date;
};

type LoginLike = {
  success: boolean;
  createdAt: Date;
};

type AdminLike = {
  twoFactorEnabled?: boolean | null;
  phone?: string | null;
};

export function calculateSecuritySummary(
  sessions: SessionLike[],
  loginAttempts: LoginLike[],
  adminUsers: AdminLike[],
  now: Date = new Date(),
): SecuritySummary {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const day24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let activeSessions = 0;
  let revokedSessions = 0;
  let expiredSessions = 0;

  for (const session of sessions) {
    const status = getSessionStatus(session, now);
    if (status === SessionStatus.ACTIVE) activeSessions += 1;
    else if (status === SessionStatus.REVOKED) revokedSessions += 1;
    else expiredSessions += 1;
  }

  let failedLogins24h = 0;
  let successfulLogins24h = 0;
  let successfulLoginsToday = 0;
  let failedLoginsToday = 0;

  for (const attempt of loginAttempts) {
    const at = attempt.createdAt;
    if (at >= day24h) {
      if (attempt.success) successfulLogins24h += 1;
      else failedLogins24h += 1;
    }
    if (at >= dayStart) {
      if (attempt.success) successfulLoginsToday += 1;
      else failedLoginsToday += 1;
    }
  }

  const twoFactorEnabled = adminUsers.filter((u) => Boolean(u.twoFactorEnabled)).length;
  const smsPhoneEnabled = adminUsers.filter((u) => Boolean(u.phone?.trim())).length;
  const twoFactorTotal = adminUsers.length;
  const twoFactorAdoptionPercent =
    twoFactorTotal > 0 ? Math.round((twoFactorEnabled / twoFactorTotal) * 100) : 0;
  const smsPhoneAdoptionPercent =
    twoFactorTotal > 0 ? Math.round((smsPhoneEnabled / twoFactorTotal) * 100) : 0;

  return {
    activeSessions,
    revokedSessions,
    expiredSessions,
    failedLogins24h,
    successfulLogins24h,
    successfulLoginsToday,
    failedLoginsToday,
    twoFactorEnabled,
    smsPhoneEnabled,
    twoFactorTotal,
    twoFactorAdoptionPercent,
    smsPhoneAdoptionPercent,
  };
}

const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

function formatDayLabel(date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      day: 'numeric',
      month: 'short',
    }).formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    const month = parts.find((p) => p.type === 'month')?.value ?? '';
    return `${day} ${month}`;
  } catch {
    return `${date.getDate()} ${JALALI_MONTHS[date.getMonth()]}`;
  }
}

export function buildDailyLoginSeries(loginAttempts: LoginLike[], days = 14, now: Date = new Date()): DailyLoginPoint[] {
  const points: DailyLoginPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const dateKey = day.toISOString().slice(0, 10);

    let success = 0;
    let failed = 0;
    for (const attempt of loginAttempts) {
      const at = attempt.createdAt;
      if (at >= day && at < nextDay) {
        if (attempt.success) success += 1;
        else failed += 1;
      }
    }

    points.push({
      label: formatDayLabel(day),
      dateKey,
      success,
      failed,
      total: success + failed,
    });
  }
  return points;
}
