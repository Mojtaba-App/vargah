'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

type StatusBannerProps = {
  type: 'success' | 'error' | 'info';
  message: string;
  className?: string;
  /** میلی‌ثانیه تا پنهان‌شدن خودکار؛ پیش‌فرض: success/info = ۴ ثانیه، error = بدون پنهان */
  autoHideMs?: number | false;
  /** پس از پنهان‌شدن فراخوانی می‌شود تا state والد پاک شود و پیغام بعدی دوباره دیده شود */
  onDismiss?: () => void;
};

const styles = {
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  error: 'border-destructive/25 bg-destructive/10 text-destructive',
  info: 'border-primary/25 bg-primary/10 text-primary',
};

const DEFAULT_AUTO_HIDE_MS: Record<StatusBannerProps['type'], number | false> = {
  success: 4000,
  info: 4000,
  error: false,
};

export function StatusBanner({
  type,
  message,
  className,
  autoHideMs,
  onDismiss,
}: StatusBannerProps) {
  const [visible, setVisible] = useState(true);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const hideAfter = autoHideMs === undefined ? DEFAULT_AUTO_HIDE_MS[type] : autoHideMs;

  useEffect(() => {
    setVisible(true);
    if (hideAfter === false || hideAfter <= 0) return;

    const timer = window.setTimeout(() => {
      setVisible(false);
      onDismissRef.current?.();
    }, hideAfter);

    return () => window.clearTimeout(timer);
  }, [message, type, hideAfter]);

  if (!visible) return null;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'animate-in fade-in-0 rounded-xl border px-4 py-3 text-sm font-medium duration-200',
        styles[type],
        className,
      )}
    >
      {message}
    </div>
  );
}
