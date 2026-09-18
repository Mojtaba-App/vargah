'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuditAction } from '@vargah/database/enums';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';
import { SearchInput } from '@/components/ui/search-input';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ClientInfoBadge, UserAvatar } from '@/components/audit/client-info';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_VARIANT,
  getActionLabel,
  getEntityLabel,
} from '@/lib/audit/labels';
import { formatAuditMessage, formatChangesSummary, formatRelativeTime } from '@/lib/audit/messages';
import { parseUserAgent } from '@/lib/audit/user-agent';
import { ROLE_LABELS } from '@/lib/permissions';
import { cn, formatJalali, formatNumber } from '@/lib/utils';

export type AuditLogRow = {
  id: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  changes: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: keyof typeof ROLE_LABELS;
  } | null;
};

export type OnlineUserRow = {
  sessionId: string;
  userId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: keyof typeof ROLE_LABELS;
  ipAddress: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  recentAction: string | null;
};

type AuditWorkspaceProps = {
  logs: AuditLogRow[];
  onlineUsers: OnlineUserRow[];
  showOnlineUsers?: boolean;
};

type ActionFilter = 'ALL' | AuditAction;
type EntityFilter = 'ALL' | string;

const PAGE_SIZE = 40;
const REFRESH_MS = 45_000;

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'surface-card rounded-2xl p-4 text-start transition-colors',
        onClick && 'hover:border-primary/40',
        active && 'border-primary ring-primary/20 ring-1',
      )}
    >
      <p className="text-2xl font-bold tabular-nums">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </Comp>
  );
}

function RelativeTime({ value }: { value: string }) {
  const [label, setLabel] = useState(() => formatJalali(value, true));

  useEffect(() => {
    const tick = () => setLabel(formatRelativeTime(value));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [value]);

  return <span>{label}</span>;
}

export function AuditWorkspace({ logs, onlineUsers, showOnlineUsers = true }: AuditWorkspaceProps) {
  const router = useRouter();
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showRawChanges, setShowRawChanges] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [router]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityFilter, userFilter, debouncedSearch]);

  const entityOptions = useMemo(() => {
    const set = new Set(logs.map((log) => log.entity));
    return Array.from(set).sort((a, b) => getEntityLabel(a).localeCompare(getEntityLabel(b), 'fa'));
  }, [logs]);

  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of logs) {
      if (!log.user) continue;
      map.set(log.user.id, log.user.name ?? log.user.email ?? log.user.id);
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fa'));
  }, [logs]);

  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter((log) => new Date(log.createdAt) >= todayStart);
    return {
      total: logs.length,
      today: todayLogs.length,
      loginsToday: todayLogs.filter((log) => log.action === 'LOGIN').length,
      changesToday: todayLogs.filter((log) =>
        ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'APPROVE', 'REJECT'].includes(log.action),
      ).length,
      online: onlineUsers.length,
    };
  }, [logs, onlineUsers.length]);

  const enriched = useMemo(
    () =>
      logs.map((log) => {
        const client = parseUserAgent(log.userAgent);
        const message = formatAuditMessage({
          action: log.action,
          entity: log.entity,
          changes: log.changes,
        });
        const userName = log.user?.name ?? log.user?.email ?? 'سیستم';
        return { ...log, client, message, userName };
      }),
    [logs],
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return enriched.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (entityFilter !== 'ALL' && log.entity !== entityFilter) return false;
      if (userFilter !== 'ALL' && log.user?.id !== userFilter) return false;
      if (!q) return true;
      const haystack = [
        log.message,
        log.userName,
        log.user?.email ?? '',
        log.ipAddress ?? '',
        log.client.osLabel,
        log.client.browserLabel,
        getEntityLabel(log.entity),
        getActionLabel(log.action),
        log.entityId ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [enriched, actionFilter, entityFilter, userFilter, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const selected =
    filtered.find((log) => log.id === selectedId) ??
    enriched.find((log) => log.id === selectedId) ??
    null;

  const refreshNow = () => {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'grid gap-3 sm:grid-cols-2',
          showOnlineUsers ? 'xl:grid-cols-5' : 'xl:grid-cols-4',
        )}
      >
        {showOnlineUsers ? <StatCard label="کاربران آنلاین" value={stats.online} /> : null}
        <StatCard
          label="رویدادهای امروز"
          value={stats.today}
          active={actionFilter === 'ALL'}
          onClick={() => {
            setActionFilter('ALL');
            setEntityFilter('ALL');
            setUserFilter('ALL');
            setSearch('');
          }}
        />
        <StatCard
          label="ورود امروز"
          value={stats.loginsToday}
          active={actionFilter === 'LOGIN'}
          onClick={() => setActionFilter('LOGIN')}
        />
        <StatCard label="تغییرات امروز" value={stats.changesToday} />
        <StatCard label="رویدادهای بارگذاری‌شده" value={stats.total} />
      </div>

      {showOnlineUsers ? (
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">کاربران آنلاین</p>
                <p className="text-muted-foreground text-sm">
                  نشست‌های فعال پنل — به‌روزرسانی خودکار
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full">
                  {formatNumber(onlineUsers.length)} نفر
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  disabled={refreshing}
                  onClick={refreshNow}
                >
                  {refreshing ? 'در حال به‌روزرسانی…' : 'به‌روزرسانی'}
                </Button>
              </div>
            </div>

            {onlineUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                در حال حاضر کاربر آنلاینی ثبت نشده است.
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {onlineUsers.map((user) => {
                  const client = parseUserAgent(user.userAgent);
                  return (
                    <button
                      key={user.sessionId}
                      type="button"
                      onClick={() => {
                        setUserFilter(user.userId);
                        setSelectedId(null);
                      }}
                      className={cn(
                        'surface-card hover:border-primary/40 min-w-[250px] shrink-0 rounded-xl p-3 text-start transition-colors',
                        userFilter === user.userId && 'border-primary ring-primary/20 ring-1',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          name={user.name}
                          email={user.email}
                          avatar={user.avatar}
                          online
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {user.name ?? user.email ?? 'کاربر'}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {ROLE_LABELS[user.role] ?? user.role}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            نشست از <RelativeTime value={user.lastSeenAt} />
                          </p>
                          {user.recentAction ? (
                            <p className="text-primary/90 mt-1 line-clamp-1 text-[11px]">
                              آخرین فعالیت: {user.recentAction}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="border-border/60 mt-3 border-t pt-3">
                        <ClientInfoBadge
                          os={client.os}
                          osLabel={client.osLabel}
                          browserLabel={client.browserLabel}
                          ipAddress={user.ipAddress}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          id="audit-search"
          placeholder="جستجو در کاربر، IP، مرورگر، پیام، شناسه..."
          value={search}
          onChange={setSearch}
          aria-label="جستجوی لاگ"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
            className="border-border bg-background h-10 rounded-xl border px-3 text-sm"
            aria-label="فیلتر عملیات"
          >
            <option value="ALL">همه عملیات</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="border-border bg-background h-10 rounded-xl border px-3 text-sm"
            aria-label="فیلتر بخش"
          >
            <option value="ALL">همه بخش‌ها</option>
            {entityOptions.map((entity) => (
              <option key={entity} value={entity}>
                {getEntityLabel(entity)}
              </option>
            ))}
          </select>
          {showOnlineUsers ? (
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="border-border bg-background h-10 max-w-[12rem] rounded-xl border px-3 text-sm"
              aria-label="فیلتر کاربر"
            >
              <option value="ALL">همه کاربران</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
          ) : null}
          <ExportToolbar
            title="گزارش لاگ حسابرسی"
            subtitle="رویدادهای فیلترشده پنل"
            filenameBase="audit-log-report"
            columns={[
              { key: 'time', header: 'زمان', width: 16 },
              { key: 'user', header: 'کاربر', width: 16 },
              { key: 'action', header: 'عملیات', width: 12 },
              { key: 'entity', header: 'بخش', width: 14 },
              { key: 'message', header: 'پیام', width: 36 },
              { key: 'ip', header: 'IP', width: 14 },
              { key: 'device', header: 'دستگاه', width: 18 },
            ]}
            rows={filtered.map((row) => ({
              time: formatJalali(row.createdAt, true),
              user: row.userName,
              action: getActionLabel(row.action),
              entity: getEntityLabel(row.entity),
              message: row.message,
              ip: row.ipAddress,
              device: `${row.client.osLabel} / ${row.client.browserLabel}`,
            }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH'] as const).map((action) => (
          <Button
            key={action}
            type="button"
            size="sm"
            variant={actionFilter === action ? 'default' : 'outline'}
            className="rounded-xl"
            onClick={() => setActionFilter(action)}
          >
            {action === 'ALL' ? 'همه' : getActionLabel(action)}
          </Button>
        ))}
        {(actionFilter !== 'ALL' || entityFilter !== 'ALL' || userFilter !== 'ALL' || search) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-xl"
            onClick={() => {
              setActionFilter('ALL');
              setEntityFilter('ALL');
              setUserFilter('ALL');
              setSearch('');
            }}
          >
            پاک‌کردن فیلترها
          </Button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className={cn('space-y-3', selected ? 'xl:col-span-2' : 'xl:col-span-3')}>
          {pageItems.length === 0 ? (
            <div className="surface-card text-muted-foreground rounded-2xl p-12 text-center">
              رویدادی با این فیلتر یافت نشد.
            </div>
          ) : (
            pageItems.map((log) => (
              <button
                key={log.id}
                type="button"
                onClick={() => {
                  setSelectedId(log.id);
                  setShowRawChanges(false);
                }}
                className={cn(
                  'surface-card hover:border-primary/40 w-full rounded-2xl p-4 text-start transition-colors',
                  selectedId === log.id && 'border-primary ring-primary/20 ring-1',
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <UserAvatar
                      name={log.user?.name}
                      email={log.user?.email}
                      avatar={log.user?.avatar}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{log.userName}</p>
                        <Badge variant={AUDIT_ACTION_VARIANT[log.action] ?? 'outline'}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <Badge variant="secondary">{getEntityLabel(log.entity)}</Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6">{log.message}</p>
                      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-xs">
                        <time dateTime={log.createdAt}>{formatJalali(log.createdAt, true)}</time>
                        <RelativeTime value={log.createdAt} />
                      </div>
                    </div>
                  </div>
                  <ClientInfoBadge
                    os={log.client.os}
                    osLabel={log.client.osLabel}
                    browserLabel={log.client.browserLabel}
                    ipAddress={log.ipAddress}
                    className="sm:w-44"
                  />
                </div>
              </button>
            ))
          )}

          {filtered.length > PAGE_SIZE ? (
            <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                نمایش {formatNumber((pageSafe - 1) * PAGE_SIZE + 1)} تا{' '}
                {formatNumber(Math.min(pageSafe * PAGE_SIZE, filtered.length))} از{' '}
                {formatNumber(filtered.length)} رویداد
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  قبلی
                </Button>
                <span className="text-muted-foreground tabular-nums">
                  {formatNumber(pageSafe)} / {formatNumber(totalPages)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  بعدی
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {selected ? (
          <Card className="rounded-2xl xl:sticky xl:top-4 xl:self-start">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">جزئیات رویداد</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  بستن
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <UserAvatar
                  name={selected.user?.name}
                  email={selected.user?.email}
                  avatar={selected.user?.avatar}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{selected.userName}</p>
                  {selected.user ? (
                    <p className="text-muted-foreground text-xs">
                      {ROLE_LABELS[selected.user.role] ?? selected.user.role}
                      {selected.user.email ? ` · ${selected.user.email}` : ''}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs">رویداد سیستمی</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">پیام: </span>
                  {selected.message}
                </p>
                <p>
                  <span className="text-muted-foreground">زمان: </span>
                  {formatJalali(selected.createdAt, true)}
                  <span className="text-muted-foreground ms-2 text-xs">
                    (<RelativeTime value={selected.createdAt} />
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">بخش: </span>
                  {getEntityLabel(selected.entity)}
                </p>
                <p>
                  <span className="text-muted-foreground">عملیات: </span>
                  {getActionLabel(selected.action)}
                </p>
                {selected.entityId ? (
                  <p className="font-mono text-xs break-all" dir="ltr">
                    شناسه: {selected.entityId}
                  </p>
                ) : null}
              </div>

              <ClientInfoBadge
                os={selected.client.os}
                osLabel={selected.client.osLabel}
                browserLabel={selected.client.browserLabel}
                ipAddress={selected.ipAddress}
              />

              {selected.changes != null ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">خلاصه تغییرات</p>
                  <p className="text-muted-foreground text-sm leading-6">
                    {formatChangesSummary(selected.entity, selected.changes) ?? '—'}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setShowRawChanges((v) => !v)}
                  >
                    {showRawChanges ? 'مخفی‌کردن جزئیات خام' : 'نمایش جزئیات خام'}
                  </Button>
                  {showRawChanges ? (
                    <pre
                      className="bg-muted/50 max-h-48 overflow-auto rounded-xl p-3 text-xs"
                      dir="ltr"
                    >
                      {JSON.stringify(selected.changes, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ) : null}

              {selected.userAgent ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">مرورگر / دستگاه</p>
                  <p className="text-muted-foreground text-xs leading-5 break-all" dir="ltr">
                    {selected.userAgent}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
