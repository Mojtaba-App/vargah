'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AlertTriangleIcon,
  InfoIcon,
} from '@/components/dashboard/dashboard-icons';
import { BellIcon, BellRingIcon } from '@/components/layout/nav-icons';
import { acknowledgeCurrentAdminAlerts, fetchAdminAlerts } from '@/actions/alerts';
import type { AdminAlert } from '@/lib/admin-alerts';
import { getAdminAlertUnreadCount } from '@/lib/admin-alerts';
import { cn, formatNumber } from '@/lib/utils';

const typeStyles = {
  info: { dot: 'bg-sky-500', icon: InfoIcon, wrap: 'hover:bg-sky-500/5' },
  warn: { dot: 'bg-amber-500', icon: AlertTriangleIcon, wrap: 'hover:bg-amber-500/5' },
  error: { dot: 'bg-rose-500', icon: AlertTriangleIcon, wrap: 'hover:bg-rose-500/5' },
} as const;

type NotificationBellProps = {
  initialAlerts: AdminAlert[];
};

export function NotificationBell({ initialAlerts }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [refreshing, setRefreshing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = getAdminAlertUnreadCount(alerts);
  const Bell = unreadCount > 0 ? BellRingIcon : BellIcon;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = await fetchAdminAlerts();
      setAlerts(next);
    } catch {
      /* keep previous */
    } finally {
      setRefreshing(false);
    }
  }, []);

  const markSeen = useCallback(async () => {
    try {
      const next = await acknowledgeCurrentAdminAlerts();
      setAlerts(next);
      router.refresh();
    } catch {
      await refresh();
    }
  }, [refresh, router]);

  useEffect(() => {
    const interval = window.setInterval(() => void refresh(), 15_000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    void markSeen();
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, markSeen]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
        }}
        className={cn(
          'relative rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          open && 'bg-muted text-foreground',
          unreadCount > 0 && 'text-foreground',
        )}
        aria-label={unreadCount > 0 ? `${formatNumber(unreadCount)} اعلان جدید` : 'اعلان‌ها'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className={cn('size-5', unreadCount > 0 && 'text-primary')} />
        {unreadCount > 0 && (
          <span
            className="absolute end-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-pulse"
            aria-live="polite"
          >
            {unreadCount > 99 ? '99+' : formatNumber(unreadCount)}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute end-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
          role="menu"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="font-semibold">اعلان‌ها</p>
              {unreadCount > 0 && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                  {formatNumber(unreadCount)} جدید
                </span>
              )}
            </div>
            <button
              type="button"
              className="text-xs text-primary hover:underline disabled:opacity-50"
              disabled={refreshing}
              onClick={() => void refresh()}
            >
              {refreshing ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
            </button>
          </div>

          {alerts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">اعلان فعالی نیست</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-2">
              {alerts.map((alert) => {
                const style = typeStyles[alert.type];
                const Icon = style.icon;
                return (
                  <li key={alert.id}>
                    <Link
                      href={alert.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                        style.wrap,
                      )}
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 leading-relaxed">{alert.text}</span>
                      {alert.unreadCount > 0 ? (
                        <span className="mt-0.5 shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                          {formatNumber(alert.unreadCount)}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-border p-2">
            <button
              type="button"
              className="w-full rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              onClick={() => {
                setOpen(false);
                router.push('/');
              }}
            >
              مشاهده داشبورد
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
