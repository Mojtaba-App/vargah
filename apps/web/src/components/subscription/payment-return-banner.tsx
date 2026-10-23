'use client';

import { useEffect, useId } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ctaBase =
  'inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-[color,background-color,box-shadow,transform] duration-200 focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]';
const ctaPrimary = 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90';
const ctaOutline = 'border-border bg-background/80 text-foreground border shadow-sm hover:bg-muted';
const ctaGhost = 'text-foreground hover:bg-muted';

export type PaymentReturnStatus = 'success' | 'cancelled' | 'failed' | 'error';

type PaymentReturnBannerProps = {
  status: PaymentReturnStatus;
  /** شماره پیگیری زرین‌پال — فقط برای پرداخت موفق تازه */
  reference?: string | null;
  onDismiss?: () => void;
};

type Tone = {
  title: string;
  description: string;
  shell: string;
  iconWrap: string;
  accent: string;
};

const TONES: Record<'success' | 'cancelled' | 'failed', Tone> = {
  success: {
    title: 'پرداخت موفق',
    description: 'تراکنش تأیید شد و اشتراک شما فعال است. رسید و جزئیات را در پروفایل ببینید.',
    shell: 'border-success/25 from-success/12 via-background to-background',
    iconWrap: 'bg-success text-success-foreground',
    accent: 'bg-success',
  },
  cancelled: {
    title: 'پرداخت لغو شد',
    description:
      'از درگاه بدون پرداخت برگشتید. سبد خریدتان محفوظ است؛ هر وقت آماده بودید دوباره اقدام کنید.',
    shell: 'border-amber-500/25 from-amber-500/10 via-background to-background',
    iconWrap: 'bg-amber-600 text-white dark:bg-amber-500',
    accent: 'bg-amber-500',
  },
  failed: {
    title: 'پرداخت ناموفق',
    description:
      'تراکنش کامل نشد یا توسط بانک تأیید نشد. مبلغی کسر نشده یا در صورت کسر، حداکثر ۷۲ ساعت برمی‌گردد.',
    shell: 'border-destructive/25 from-destructive/10 via-background to-background',
    iconWrap: 'bg-destructive text-destructive-foreground',
    accent: 'bg-destructive',
  },
};

function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CancelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function FailedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 8v5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      <path
        d="M10.2 3.8 2.6 17.2A2 2 0 0 0 4.35 20h15.3a2 2 0 0 0 1.75-2.8L13.8 3.8a2 2 0 0 0-3.6 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeStatus(status: PaymentReturnStatus): 'success' | 'cancelled' | 'failed' {
  if (status === 'success') return 'success';
  if (status === 'cancelled') return 'cancelled';
  return 'failed';
}

export function PaymentReturnBanner({ status, reference, onDismiss }: PaymentReturnBannerProps) {
  const headingId = useId();
  const prefersReducedMotion = useReducedMotion();
  const toneKey = normalizeStatus(status);
  const tone = TONES[toneKey];
  const showRef = toneKey === 'success' && Boolean(reference) && reference !== 'duplicate';
  const isDuplicate = toneKey === 'success' && reference === 'duplicate';

  useEffect(() => {
    const node = document.getElementById('payment-return');
    node?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });

    const url = new URL(window.location.href);
    if (url.searchParams.has('payment') || url.searchParams.has('ref')) {
      url.searchParams.delete('payment');
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [prefersReducedMotion]);

  const Icon =
    toneKey === 'success' ? SuccessIcon : toneKey === 'cancelled' ? CancelIcon : FailedIcon;

  return (
    <motion.section
      id="payment-return"
      role="status"
      aria-labelledby={headingId}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-gradient-to-bl p-5 sm:p-7',
        tone.shell,
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1 opacity-90', tone.accent)} aria-hidden />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <motion.div
          className={cn(
            'grid size-14 shrink-0 place-items-center rounded-2xl shadow-sm',
            tone.iconWrap,
          )}
          initial={prefersReducedMotion ? false : { scale: 0.7, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.05 }}
        >
          <Icon className="size-7" />
        </motion.div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1.5">
            <h2
              id={headingId}
              className="text-foreground text-xl font-bold tracking-tight sm:text-2xl"
            >
              {tone.title}
            </h2>
            <p className="text-muted-foreground text-sm leading-7 sm:text-[0.95rem]">
              {isDuplicate
                ? 'این پرداخت قبلاً ثبت شده بود. اشتراک شما از قبل فعال است.'
                : tone.description}
            </p>
          </div>

          {showRef && (
            <div
              className="border-border/70 bg-background/70 inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm"
              dir="ltr"
            >
              <span className="text-muted-foreground shrink-0">کد پیگیری</span>
              <span className="text-foreground font-mono font-semibold tracking-wide break-all">
                {reference}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {toneKey === 'success' ? (
              <>
                <Link href="/profile?tab=payments" className={cn(ctaBase, ctaPrimary)}>
                  مشاهده خریدها
                </Link>
                <Link href="/profile" className={cn(ctaBase, ctaOutline)}>
                  رفتن به پروفایل
                </Link>
              </>
            ) : (
              <>
                <Link href="#checkout" className={cn(ctaBase, ctaPrimary)}>
                  ادامه خرید
                </Link>
                <Link href="/profile?tab=tickets" className={cn(ctaBase, ctaOutline)}>
                  پیام به پشتیبانی
                </Link>
              </>
            )}
            {onDismiss && (
              <button type="button" className={cn(ctaBase, ctaGhost)} onClick={onDismiss}>
                بستن
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export function isPaymentReturnStatus(
  value: string | null | undefined,
): value is PaymentReturnStatus {
  return value === 'success' || value === 'cancelled' || value === 'failed' || value === 'error';
}
