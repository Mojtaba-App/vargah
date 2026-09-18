'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';

import { useCustomerAuth } from '@/components/auth/customer-auth-provider';
import { headerActionButtonClass } from '@/components/layout/header-action-button';
import {
  getCustomerNotifications,
  markCustomerChatNotificationsRead,
  markCustomerTicketNotificationsRead,
  type CustomerNotificationSummary,
} from '@/actions/notifications';
import { cn } from '@/lib/utils';

const EMPTY: CustomerNotificationSummary = {
  notices: [],
  ticketCount: 0,
  messageCount: 0,
  total: 0,
};

const TAG_STYLES = {
  تیکت: 'border-primary/30 bg-accent text-accent-foreground',
  پیام: 'border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-50',
} as const;

export function NotificationBell({ className }: { className?: string }) {
  const { isAuthenticated } = useCustomerAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<CustomerNotificationSummary>(EMPTY);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      setSummary(await getCustomerNotifications());
    } catch {
      setSummary(EMPTY);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20_000);
    const onChange = () => void refresh();
    window.addEventListener('focus', onChange);
    window.addEventListener('vargah-notifications-changed', onChange);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onChange);
      window.removeEventListener('vargah-notifications-changed', onChange);
    };
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const openNotice = async (notice: CustomerNotificationSummary['notices'][number]) => {
    setOpen(false);
    if (notice.kind === 'message') {
      await markCustomerChatNotificationsRead().catch(() => undefined);
      window.dispatchEvent(new Event('vargah-open-chat'));
    } else {
      await markCustomerTicketNotificationsRead().catch(() => undefined);
      router.push(notice.href);
    }
    window.dispatchEvent(new Event('vargah-notifications-changed'));
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          void refresh();
        }}
        className={cn(headerActionButtonClass, 'relative', summary.total > 0 && 'text-primary')}
        aria-label={
          summary.total > 0
            ? `${summary.total.toLocaleString('fa-IR')} اعلان خوانده‌نشده`
            : 'اعلان‌ها'
        }
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <BellIcon />
        {summary.total > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold">
            {summary.total > 9 ? '۹+' : summary.total.toLocaleString('fa-IR')}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="اعلان‌های خوانده‌نشده"
          className="border-border bg-background absolute end-0 top-[calc(100%+0.5rem)] z-[80] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-xl"
        >
          <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
            <p className="text-sm font-bold">اعلان‌ها</p>
            <div className="flex gap-1.5">
              <CountTag label="تیکت" count={summary.ticketCount} />
              <CountTag label="پیام" count={summary.messageCount} />
            </div>
          </div>

          {summary.notices.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              پیام یا تیکت خوانده‌نشده‌ای نیست.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto p-2">
              {summary.notices.map((notice) => (
                <li key={`${notice.kind}-${notice.id}`}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void openNotice(notice)}
                    className="hover:bg-muted flex w-full flex-col gap-1.5 rounded-xl px-3 py-2.5 text-start"
                  >
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                          TAG_STYLES[notice.tag],
                        )}
                      >
                        {notice.tag}
                        {notice.count > 1 ? ` ${notice.count.toLocaleString('fa-IR')}` : ''}
                      </span>
                      {notice.statusLabel && (
                        <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[10px]">
                          {notice.statusLabel}
                        </span>
                      )}
                      {notice.priorityLabel && (
                        <span className="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-900 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-50">
                          {notice.priorityLabel}
                        </span>
                      )}
                    </span>
                    <span className="truncate text-sm font-medium">{notice.title}</span>
                    {notice.preview ? (
                      <span className="text-muted-foreground line-clamp-2 text-xs">
                        {notice.preview}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CountTag({ label, count }: { label: keyof typeof TAG_STYLES; count: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        count > 0 ? TAG_STYLES[label] : 'border-border text-muted-foreground',
      )}
    >
      {label}
      <span className="tabular-nums">{count.toLocaleString('fa-IR')}</span>
    </span>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10 20a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
