'use client';

import { useEffect, useState, useTransition } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Input, Label } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';

import { sendCustomerOtp, verifyCustomerOtp, type CustomerSession } from '@/actions/customer-auth';
import { getLoginReasonMessage, type LoginReason } from '@/components/auth/customer-auth-provider';
import { isValidIranPhone } from '@/lib/customer-auth/phone';
import { cn } from '@/lib/utils';

type LoginDialogProps = {
  open: boolean;
  reason: LoginReason;
  onClose: () => void;
  onVerified: (session: CustomerSession) => void;
};

type Step = 'phone' | 'otp';

export function LoginDialog({ open, reason, onClose, onVerified }: LoginDialogProps) {
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setStep('phone');
      setPhone('');
      setCode('');
      setError(null);
      setSandboxMode(false);
      setDevCode(null);
      setExpiresAt(null);
    }
  }, [open]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const reasonMessage = getLoginReasonMessage(reason);

  const handleSendOtp = () => {
    setError(null);
    if (!isValidIranPhone(phone)) {
      setError('شماره موبایل معتبر نیست. نمونه: 09123456789');
      return;
    }

    startTransition(async () => {
      try {
        const result = await sendCustomerOtp(phone);
        setPhone(result.phone);
        setSandboxMode(result.sandboxMode);
        setDevCode(result.devCode ?? null);
        setExpiresAt(new Date(result.expiresAt).getTime());
        setStep('otp');
      } catch (err) {
        if (err instanceof Error && err.message === 'RATE_LIMIT_EXCEEDED') {
          setError('تعداد درخواست‌ها زیاد است. چند دقیقه بعد دوباره تلاش کنید.');
          return;
        }
        setError(err instanceof Error ? err.message : 'ارسال کد با خطا مواجه شد.');
      }
    });
  };

  const handleVerify = () => {
    setError(null);
    if (code.length !== 6) {
      setError('کد ۶ رقمی را کامل وارد کنید.');
      return;
    }

    startTransition(async () => {
      try {
        const session = await verifyCustomerOtp(phone, code);
        onVerified(session);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'کد تأیید نامعتبر است.');
      }
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="بستن"
            className="bg-foreground/40 absolute inset-0 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-dialog-title"
            className="border-border bg-background relative z-10 w-full max-w-md rounded-t-3xl border p-6 shadow-2xl sm:rounded-3xl"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-primary text-xs font-medium tracking-wide uppercase">
                  ورود مشتری
                </p>
                <h2 id="login-dialog-title" className="mt-1 text-xl font-bold">
                  {step === 'phone' ? 'ورود با موبایل' : 'تأیید کد'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-2 transition-colors"
                aria-label="بستن پنجره ورود"
              >
                <CloseIcon />
              </button>
            </div>

            {reasonMessage && (
              <p className="border-primary/20 bg-primary/5 text-foreground mb-4 rounded-xl border px-4 py-3 text-sm">
                {reasonMessage}
              </p>
            )}

            {step === 'phone' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-phone">شماره موبایل</Label>
                  <Input
                    id="login-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    dir="ltr"
                    inputMode="tel"
                    autoComplete="tel"
                    disabled={pending}
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  type="button"
                  className="h-11 w-full rounded-xl"
                  disabled={pending}
                  onClick={handleSendOtp}
                >
                  {pending ? 'در حال ارسال...' : 'دریافت کد تأیید'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sandboxMode && devCode && (
                  <DevOtpBanner
                    code={devCode}
                    secondsLeft={secondsLeft}
                    onUseCode={() => {
                      setCode(devCode);
                      setError(null);
                    }}
                  />
                )}
                <p className="text-muted-foreground text-sm">
                  کد ۶ رقمی ارسال‌شده به{' '}
                  <span className="text-foreground font-medium" dir="ltr">
                    {phone}
                  </span>{' '}
                  را وارد کنید.
                  {secondsLeft > 0 && (
                    <span className="text-primary ms-2 tabular-nums">({secondsLeft} ثانیه)</span>
                  )}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="login-otp">کد تأیید</Label>
                  <Input
                    id="login-otp"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={pending}
                    className="text-center text-lg tracking-[0.35em]"
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  type="button"
                  className="h-11 w-full rounded-xl"
                  disabled={pending || secondsLeft === 0}
                  onClick={handleVerify}
                >
                  {pending ? 'در حال بررسی...' : 'ورود به حساب'}
                </Button>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      setStep('phone');
                      setCode('');
                      setDevCode(null);
                      setError(null);
                    }}
                  >
                    تغییر شماره
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'text-primary transition-opacity',
                      (pending || secondsLeft > 0) && 'pointer-events-none opacity-40',
                    )}
                    onClick={handleSendOtp}
                  >
                    ارسال مجدد کد
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DevOtpBanner({
  code,
  secondsLeft,
  onUseCode,
}: {
  code: string;
  secondsLeft: number;
  onUseCode: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
      <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
        حالت توسعه — پیامک ارسال نمی‌شود
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">کد OTP تستی</p>
          <p
            className="mt-0.5 font-mono text-2xl font-bold tracking-[0.25em] text-amber-950 dark:text-amber-100"
            dir="ltr"
          >
            {code}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={handleCopy}
          >
            {copied ? 'کپی شد' : 'کپی'}
          </Button>
          <Button type="button" size="sm" className="rounded-lg" onClick={onUseCode}>
            پر کردن خودکار
          </Button>
        </div>
      </div>
      {secondsLeft === 0 && (
        <p className="text-destructive mt-2 text-xs">کد منقضی شده — «ارسال مجدد» را بزنید.</p>
      )}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
