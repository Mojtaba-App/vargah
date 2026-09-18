'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { DataTable } from '@/components/ui/data-table';
import { WorkspaceSearchField } from '@/components/ui/workspace-search-field';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ClientInfoBadge, UserAvatar } from '@/components/audit/client-info';
import { LoginTrendChart } from '@/components/security/security-charts';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { revokeSession } from '@/actions/security';
import { formatRelativeTime } from '@/lib/audit/messages';
import { parseUserAgent } from '@/lib/audit/user-agent';
import { ROLE_LABELS } from '@/lib/permissions';
import {
  getSessionStatus,
  LOGIN_RESULT_LABELS,
  LOGIN_RESULT_VARIANT,
  LoginResult,
  LoginResultFilter,
  SECURITY_TAB_LABELS,
  SecurityTab,
  SESSION_STATUS_LABELS,
  SESSION_STATUS_VARIANT,
  SessionStatus,
  SessionStatusFilter,
} from '@/lib/security/constants';
import type { DailyLoginPoint, SecuritySummary } from '@/lib/security/summary';
import { cn, formatJalali, formatNumber } from '@/lib/utils';
import { hasAdminSmsVerification, maskPhone } from '@vargah/security/phone';

export type SessionRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  userRole: keyof typeof ROLE_LABELS;
  userAvatar: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  isCurrentUser: boolean;
};

export type LoginRow = {
  id: string;
  userId: string | null;
  email: string | null;
  success: boolean;
  ipAddress: string | null;
  createdAt: Date;
};

export type AdminTwoFactorRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: keyof typeof ROLE_LABELS;
  phone: string | null;
  lastLoginAt: Date | null;
};

type SecurityWorkspaceProps = {
  summary: SecuritySummary;
  loginTrend: DailyLoginPoint[];
  sessions: SessionRow[];
  loginAttempts: LoginRow[];
  adminUsers: AdminTwoFactorRow[];
  currentUserPhone: string | null;
  currentUserId: string;
  canManage: boolean;
};

function StatCard({
  label,
  value,
  hint,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClass = {
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-rose-700 dark:text-rose-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-indigo-600 dark:text-indigo-400',
    default: '',
  }[tone ?? 'default'];

  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'border-border bg-card rounded-2xl border p-4 text-start transition-colors',
        onClick && 'hover:border-primary/40 hover:bg-muted/30 cursor-pointer',
        active && 'border-primary ring-primary/20 ring-1',
      )}
    >
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', toneClass)}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </Comp>
  );
}

function TabButton({
  tab,
  activeTab,
  onClick,
}: {
  tab: SecurityTab;
  activeTab: SecurityTab;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
        activeTab === tab
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {SECURITY_TAB_LABELS[tab]}
    </button>
  );
}

export function SecurityWorkspace({
  summary,
  loginTrend,
  sessions: initialSessions,
  loginAttempts: initialLogins,
  adminUsers,
  currentUserPhone,
  currentUserId,
  canManage,
}: SecurityWorkspaceProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SecurityTab>(SecurityTab.OVERVIEW);
  const [sessions, setSessions] = useState(initialSessions);
  const [logins, setLogins] = useState(initialLogins);
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);
  const [selectedLogin, setSelectedLogin] = useState<LoginRow | null>(null);
  const [sessionStatusFilter, setSessionStatusFilter] = useState<SessionStatusFilter>('ALL');
  const [loginResultFilter, setLoginResultFilter] = useState<LoginResultFilter>('ALL');
  const [sessionSearch, setSessionSearch] = useState('');
  const debouncedSessionSearch = useDebouncedValue(sessionSearch);
  const [loginSearch, setLoginSearch] = useState('');
  const debouncedLoginSearch = useDebouncedValue(loginSearch);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSessions(initialSessions);
    setLogins(initialLogins);
    if (selectedSession) {
      setSelectedSession(initialSessions.find((s) => s.id === selectedSession.id) ?? null);
    }
    if (selectedLogin) {
      setSelectedLogin(initialLogins.find((l) => l.id === selectedLogin.id) ?? null);
    }
  }, [initialSessions, initialLogins, selectedSession?.id, selectedLogin?.id]);

  const enrichedSessions = useMemo(
    () =>
      sessions.map((s) => {
        const client = parseUserAgent(s.userAgent);
        const status = getSessionStatus(s);
        return { ...s, client, status };
      }),
    [sessions],
  );

  const filteredSessions = useMemo(() => {
    const q = debouncedSessionSearch.trim().toLowerCase();
    return enrichedSessions.filter((s) => {
      if (sessionStatusFilter !== 'ALL' && s.status !== sessionStatusFilter) return false;
      if (!q) return true;
      return [
        s.userName,
        s.userEmail ?? '',
        s.ipAddress ?? '',
        s.client.osLabel,
        s.client.browserLabel,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [enrichedSessions, sessionStatusFilter, debouncedSessionSearch]);

  const filteredLogins = useMemo(() => {
    const q = debouncedLoginSearch.trim().toLowerCase();
    return logins.filter((l) => {
      const result = l.success ? LoginResult.SUCCESS : LoginResult.FAILED;
      if (loginResultFilter !== 'ALL' && result !== loginResultFilter) return false;
      if (!q) return true;
      return [l.email ?? '', l.ipAddress ?? '', LOGIN_RESULT_LABELS[result]]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [logins, loginResultFilter, debouncedLoginSearch]);

  const recentFailedLogins = useMemo(() => logins.filter((l) => !l.success).slice(0, 5), [logins]);

  const refresh = () => {
    setMessage('به‌روزرسانی شد.');
    router.refresh();
  };

  const handleRevoke = () => {
    if (!selectedSession) return;
    startTransition(async () => {
      setError(null);
      try {
        await revokeSession(selectedSession.id);
        setRevokeOpen(false);
        setSelectedSession(null);
        setMessage('نشست با موفقیت قطع شد.');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'قطع نشست ناموفق بود.');
      }
    });
  };

  const sessionColumns = useMemo<ColumnDef<(typeof enrichedSessions)[number]>[]>(
    () => [
      {
        id: 'user',
        header: 'کاربر',
        cell: ({ row }) => (
          <button
            type="button"
            className="flex items-center gap-3 text-start"
            onClick={() => setSelectedSession(row.original)}
          >
            <UserAvatar
              name={row.original.userName}
              email={row.original.userEmail}
              avatar={row.original.userAvatar}
              online={row.original.status === SessionStatus.ACTIVE}
            />
            <div>
              <p className="text-primary font-medium hover:underline">{row.original.userName}</p>
              <p className="text-muted-foreground text-xs">{ROLE_LABELS[row.original.userRole]}</p>
              {row.original.isCurrentUser && (
                <Badge variant="secondary" className="mt-1">
                  نشست شما
                </Badge>
              )}
            </div>
          </button>
        ),
      },
      {
        id: 'client',
        header: 'دستگاه',
        cell: ({ row }) => (
          <ClientInfoBadge
            os={row.original.client.os}
            osLabel={row.original.client.osLabel}
            browserLabel={row.original.client.browserLabel}
            ipAddress={row.original.ipAddress}
            compact
          />
        ),
      },
      {
        id: 'status',
        header: 'وضعیت',
        cell: ({ row }) => (
          <Badge variant={SESSION_STATUS_VARIANT[row.original.status]}>
            {SESSION_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'شروع',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{formatJalali(row.original.createdAt, true)}</p>
            <p className="text-muted-foreground text-xs">
              {formatRelativeTime(row.original.createdAt)}
            </p>
          </div>
        ),
      },
    ],
    [],
  );

  const loginColumns = useMemo<ColumnDef<LoginRow>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'ایمیل',
        cell: ({ row }) => (
          <button
            type="button"
            className="text-start hover:underline"
            onClick={() => setSelectedLogin(row.original)}
          >
            <span dir="ltr">{row.original.email ?? '—'}</span>
          </button>
        ),
      },
      {
        id: 'result',
        header: 'نتیجه',
        cell: ({ row }) => {
          const result = row.original.success ? LoginResult.SUCCESS : LoginResult.FAILED;
          return (
            <Badge variant={LOGIN_RESULT_VARIANT[result]}>{LOGIN_RESULT_LABELS[result]}</Badge>
          );
        },
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP',
        cell: ({ row }) => (
          <span className="font-mono text-xs" dir="ltr">
            {row.original.ipAddress ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'زمان',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{formatJalali(row.original.createdAt, true)}</p>
            <p className="text-muted-foreground text-xs">
              {formatRelativeTime(row.original.createdAt)}
            </p>
          </div>
        ),
      },
    ],
    [],
  );

  const selectedSessionEnriched = selectedSession
    ? (enrichedSessions.find((s) => s.id === selectedSession.id) ?? null)
    : null;

  return (
    <div className="space-y-6">
      {(message || error) && (
        <StatusBanner type={error ? 'error' : 'success'} message={error ?? message!} />
      )}

      <div className="flex flex-wrap gap-2">
        {(Object.values(SecurityTab) as SecurityTab[]).map((t) => (
          <TabButton key={t} tab={t} activeTab={tab} onClick={() => setTab(t)} />
        ))}
      </div>

      {tab === SecurityTab.OVERVIEW && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="نشست‌های فعال"
              value={summary.activeSessions}
              hint={`${formatNumber(summary.revokedSessions)} لغو · ${formatNumber(summary.expiredSessions)} منقضی`}
              tone="info"
              onClick={() => {
                setTab(SecurityTab.SESSIONS);
                setSessionStatusFilter(SessionStatus.ACTIVE);
              }}
            />
            <StatCard
              label="ورود ناموفق (۲۴ ساعت)"
              value={summary.failedLogins24h}
              hint={`${formatNumber(summary.failedLoginsToday)} مورد امروز`}
              tone="danger"
              onClick={() => {
                setTab(SecurityTab.LOGINS);
                setLoginResultFilter(LoginResult.FAILED);
              }}
            />
            <StatCard
              label="ورود موفق امروز"
              value={summary.successfulLoginsToday}
              hint={`${formatNumber(summary.successfulLogins24h)} در ۲۴ ساعت اخیر`}
              tone="success"
              onClick={() => {
                setTab(SecurityTab.LOGINS);
                setLoginResultFilter(LoginResult.SUCCESS);
              }}
            />
            <StatCard
              label="پوشش احراز دو مرحله‌ای (TOTP)"
              value={`${summary.twoFactorAdoptionPercent}٪`}
              hint={`${formatNumber(summary.twoFactorEnabled)} از ${formatNumber(summary.twoFactorTotal)} نفر TOTP فعال دارند`}
              tone={summary.twoFactorAdoptionPercent >= 100 ? 'success' : 'warning'}
              onClick={() => setTab(SecurityTab.TWO_FACTOR)}
            />
          </div>

          <LoginTrendChart data={loginTrend} />

          {recentFailedLogins.length > 0 && (
            <Card className="rounded-2xl border-rose-400 bg-rose-100 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/30 dark:shadow-none">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-rose-900 dark:text-rose-300">
                      آخرین تلاش‌های ناموفق
                    </h3>
                    <p className="dark:text-muted-foreground mt-1 text-xs text-rose-800/80">
                      پایش سریع حملات brute-force احتمالی
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="dark:border-border dark:text-foreground dark:hover:bg-muted rounded-xl border-rose-400 text-rose-900 hover:bg-rose-200/70"
                    onClick={() => {
                      setTab(SecurityTab.LOGINS);
                      setLoginResultFilter(LoginResult.FAILED);
                    }}
                  >
                    مشاهده همه
                  </Button>
                </div>
                <ul className="space-y-2">
                  {recentFailedLogins.map((l) => (
                    <li
                      key={l.id}
                      className="text-foreground dark:border-border/60 dark:bg-card flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-300/80 bg-white px-3 py-2 text-sm"
                    >
                      <span dir="ltr" className="font-mono text-xs">
                        {l.email ?? '—'}
                      </span>
                      <span
                        className="dark:text-muted-foreground font-mono text-xs text-rose-800/70"
                        dir="ltr"
                      >
                        {l.ipAddress ?? '—'}
                      </span>
                      <span className="dark:text-muted-foreground text-xs text-rose-800/70">
                        {formatRelativeTime(l.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {tab === SecurityTab.TWO_FACTOR && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <div>
                <h3 className="font-semibold">ورود دو مرحله‌ای حساب شما</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  پس از ایمیل/نام کاربری و رمز، کد تأیید به موبایل ثبت‌شده ارسال می‌شود — همان روش
                  ورود کاربران سایت.
                </p>
              </div>
              <div className="border-border bg-muted/30 rounded-xl border p-4">
                <p className="text-sm font-medium">وضعیت تأیید پیامکی</p>
                {hasAdminSmsVerification(currentUserPhone) ? (
                  <div className="mt-2 space-y-1">
                    <Badge>فعال</Badge>
                    <p className="text-muted-foreground text-sm" dir="ltr">
                      {maskPhone(currentUserPhone!)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <Badge variant="outline">غیرفعال</Badge>
                    <p className="text-muted-foreground text-sm">
                      برای فعال‌سازی، موبایل را در صفحه ویرایش کاربر ثبت کنید.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <div>
                <h3 className="font-semibold">وضعیت تأیید پیامکی تیم</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {formatNumber(summary.smsPhoneEnabled)} از {formatNumber(summary.twoFactorTotal)}{' '}
                  مدیر موبایل ثبت‌شده برای OTP ورود دارند (
                  {formatNumber(summary.smsPhoneAdoptionPercent)}٪)
                </p>
              </div>
              <div className="space-y-2">
                {adminUsers.map((u) => {
                  const smsEnabled = hasAdminSmsVerification(u.phone);
                  return (
                    <div
                      key={u.id}
                      className={cn(
                        'border-border flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition-colors',
                        u.id === currentUserId && 'border-primary/30 bg-primary/5',
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar name={u.name} email={u.email} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name ?? u.email}</p>
                          <p className="text-muted-foreground text-xs">
                            {ROLE_LABELS[u.role]}
                            {u.lastLoginAt && ` · آخرین ورود ${formatRelativeTime(u.lastLoginAt)}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={smsEnabled ? 'default' : 'outline'}>
                        {smsEnabled ? 'فعال' : 'بدون موبایل'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === SecurityTab.SESSIONS && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="rounded-2xl xl:col-span-1">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <WorkspaceSearchField
                  id="session-search"
                  value={sessionSearch}
                  onChange={setSessionSearch}
                  placeholder="کاربر، IP، مرورگر..."
                />
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={sessionStatusFilter}
                    className="h-10 min-w-[9rem] rounded-xl"
                    onChange={(e) => setSessionStatusFilter(e.target.value as SessionStatusFilter)}
                  >
                    <option value="ALL">همه وضعیت‌ها</option>
                    {(Object.values(SessionStatus) as SessionStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {SESSION_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={refresh}>
                    به‌روزرسانی
                  </Button>
                </div>
              </div>
              <DataTable columns={sessionColumns} data={filteredSessions} showSearch={false} />
              <p className="text-muted-foreground text-xs">
                {formatNumber(filteredSessions.length)} نشست از {formatNumber(sessions.length)}
              </p>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            {selectedSessionEnriched ? (
              <Card className="border-primary/20 rounded-2xl">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={selectedSessionEnriched.userName}
                      email={selectedSessionEnriched.userEmail}
                      avatar={selectedSessionEnriched.userAvatar}
                      online={selectedSessionEnriched.status === SessionStatus.ACTIVE}
                    />
                    <div>
                      <h3 className="font-semibold">{selectedSessionEnriched.userName}</h3>
                      <p className="text-muted-foreground text-sm" dir="ltr">
                        {selectedSessionEnriched.userEmail}
                      </p>
                      <Badge
                        variant={SESSION_STATUS_VARIANT[selectedSessionEnriched.status]}
                        className="mt-2"
                      >
                        {SESSION_STATUS_LABELS[selectedSessionEnriched.status]}
                      </Badge>
                    </div>
                  </div>

                  <ClientInfoBadge
                    os={selectedSessionEnriched.client.os}
                    osLabel={selectedSessionEnriched.client.osLabel}
                    browserLabel={selectedSessionEnriched.client.browserLabel}
                    ipAddress={selectedSessionEnriched.ipAddress}
                  />

                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">نقش</dt>
                      <dd>{ROLE_LABELS[selectedSessionEnriched.userRole]}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">شروع نشست</dt>
                      <dd>{formatJalali(selectedSessionEnriched.createdAt, true)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">انقضا</dt>
                      <dd>{formatJalali(selectedSessionEnriched.expiresAt, true)}</dd>
                    </div>
                    {selectedSessionEnriched.revokedAt && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">لغو شده</dt>
                        <dd>{formatJalali(selectedSessionEnriched.revokedAt, true)}</dd>
                      </div>
                    )}
                  </dl>

                  {selectedSessionEnriched.userAgent && (
                    <p
                      className="bg-muted/50 text-muted-foreground rounded-lg p-2 font-mono text-[11px] break-all"
                      dir="ltr"
                    >
                      {selectedSessionEnriched.userAgent}
                    </p>
                  )}

                  {canManage && selectedSessionEnriched.status === SessionStatus.ACTIVE && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full rounded-xl"
                      disabled={isPending}
                      onClick={() => setRevokeOpen(true)}
                    >
                      خروج اجباری از نشست
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="text-muted-foreground py-12 text-center text-sm">
                  یک نشست را از جدول انتخاب کنید
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      )}

      {tab === SecurityTab.LOGINS && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <WorkspaceSearchField
                  id="login-search"
                  value={loginSearch}
                  onChange={setLoginSearch}
                  placeholder="ایمیل، IP..."
                />
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={loginResultFilter}
                    className="h-10 min-w-[9rem] rounded-xl"
                    onChange={(e) => setLoginResultFilter(e.target.value as LoginResultFilter)}
                  >
                    <option value="ALL">همه نتایج</option>
                    <option value={LoginResult.SUCCESS}>
                      {LOGIN_RESULT_LABELS[LoginResult.SUCCESS]}
                    </option>
                    <option value={LoginResult.FAILED}>
                      {LOGIN_RESULT_LABELS[LoginResult.FAILED]}
                    </option>
                  </Select>
                  <ExportToolbar
                    title="گزارش تلاش‌های ورود"
                    subtitle="لاگ امنیتی فیلترشده"
                    filenameBase="security-login-log"
                    columns={[
                      { key: 'email', header: 'ایمیل', width: 22 },
                      { key: 'result', header: 'نتیجه', width: 10 },
                      { key: 'ip', header: 'IP', width: 16 },
                      { key: 'time', header: 'زمان', width: 18 },
                    ]}
                    rows={filteredLogins.map((row) => ({
                      email: row.email,
                      result: row.success ? 'موفق' : 'ناموفق',
                      ip: row.ipAddress,
                      time: formatJalali(row.createdAt, true),
                    }))}
                    onDone={setMessage}
                    onError={setError}
                  />
                  <Button type="button" variant="outline" className="rounded-xl" onClick={refresh}>
                    به‌روزرسانی
                  </Button>
                </div>
              </div>
              <DataTable columns={loginColumns} data={filteredLogins} showSearch={false} />
              <p className="text-muted-foreground text-xs">
                {formatNumber(filteredLogins.length)} رکورد از {formatNumber(logins.length)}
              </p>
            </CardContent>
          </Card>

          <aside>
            {selectedLogin ? (
              <Card className="border-primary/20 rounded-2xl">
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h3 className="font-semibold">جزئیات تلاش ورود</h3>
                    <Badge
                      variant={
                        selectedLogin.success
                          ? LOGIN_RESULT_VARIANT[LoginResult.SUCCESS]
                          : LOGIN_RESULT_VARIANT[LoginResult.FAILED]
                      }
                      className="mt-2"
                    >
                      {selectedLogin.success
                        ? LOGIN_RESULT_LABELS[LoginResult.SUCCESS]
                        : LOGIN_RESULT_LABELS[LoginResult.FAILED]}
                    </Badge>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">ایمیل</dt>
                      <dd dir="ltr">{selectedLogin.email ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">IP</dt>
                      <dd className="font-mono text-xs" dir="ltr">
                        {selectedLogin.ipAddress ?? '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">زمان</dt>
                      <dd>{formatJalali(selectedLogin.createdAt, true)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">نسبی</dt>
                      <dd>{formatRelativeTime(selectedLogin.createdAt)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="text-muted-foreground py-12 text-center text-sm">
                  یک رکورد را از جدول انتخاب کنید
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={revokeOpen}
        title="خروج اجباری از نشست"
        description={
          selectedSessionEnriched?.isCurrentUser
            ? 'این نشست متعلق به شماست. پس از قطع، باید دوباره وارد شوید.'
            : 'آیا مطمئن هستید که می‌خواهید این نشست کاربر را قطع کنید؟'
        }
        confirmLabel="بله، قطع نشست"
        cancelLabel="انصراف"
        variant="destructive"
        loading={isPending}
        onConfirm={handleRevoke}
        onCancel={() => {
          if (!isPending) setRevokeOpen(false);
        }}
      />
    </div>
  );
}
