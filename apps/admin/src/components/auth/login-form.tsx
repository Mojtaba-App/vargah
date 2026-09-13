'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogoMark } from '@/components/brand-logo';
import { adminApiPath } from '@/lib/base-path';
import { Input, Label } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { DevOtpBanner } from '@/components/auth/dev-otp-banner';
import { cn } from '@/lib/utils';

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

type FieldProps = {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

function Field({ id, label, icon, children }: FieldProps) {
  return (
    <div>
      <Label htmlFor={id} required className="mb-2 text-foreground/90">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

type LoginStep = 'credentials' | 'sms' | 'totp';

function formatLockMinutes(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(1, Math.ceil(diff / 60_000));
}

export function LoginForm({
  siteName = 'وارگه',
  siteTagline = 'پنل مدیریت تحریریه',
  loginLogo,
  adminLogo,
}: {
  siteName?: string;
  siteTagline?: string;
  loginLogo?: string;
  adminLogo?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [sandboxMode, setSandboxMode] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  useEffect(() => {
    if (!expiresAt || step !== 'sms') return;
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, step]);

  const applyOtpResponse = (data: {
    maskedPhone?: string;
    expiresAt?: string;
    sandboxMode?: boolean;
    devCode?: string;
  }) => {
    setMaskedPhone(data.maskedPhone ?? '');
    setSandboxMode(Boolean(data.sandboxMode));
    setDevCode(data.devCode ?? null);
    if (data.expiresAt) {
      setExpiresAt(new Date(data.expiresAt).getTime());
    }
    setStep('sms');
    setError('');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(adminApiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (data.error === 'ACCOUNT_LOCKED') {
        const minutes = data.lockedUntil ? formatLockMinutes(data.lockedUntil) : 15;
        setError(
          `به دلیل ۳ بار ورود ناموفق، دسترسی شما به مدت ${minutes} دقیقه مسدود شده است. لطفاً با مدیر سیستم تماس بگیرید.`,
        );
        return;
      }

      if (res.status === 429) {
        setError('تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.');
        return;
      }

      if (data.requiresSmsOtp) {
        applyOtpResponse(data);
        return;
      }

      if (!res.ok) {
        if (data.error === 'PHONE_NOT_REGISTERED') {
          setError('شماره موبایل برای این حساب ثبت نشده است. با مدیر سیستم تماس بگیرید.');
          return;
        }
        if (typeof data.remainingAttempts === 'number' && data.remainingAttempts > 0) {
          setError(
            `ایمیل/نام کاربری یا رمز عبور نادرست است. ${data.remainingAttempts} تلاش دیگر باقی مانده.`,
          );
          return;
        }
        setError('ایمیل/نام کاربری یا رمز عبور نادرست است، یا دسترسی به پنل ندارید.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(adminApiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'INVALID_SMS_CODE') {
          setError('کد پیامکی نادرست یا منقضی شده است.');
        } else if (data.error === 'INVALID_CHALLENGE') {
          setError('نشست ورود منقضی شده. دوباره از ابتدا وارد شوید.');
          setStep('credentials');
        } else {
          setError('تأیید پیامک ناموفق بود.');
        }
        return;
      }

      if (data.requiresTotp) {
        setTotpCode('');
        setStep('totp');
        setError('');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(adminApiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'INVALID_TOTP') {
          setError('کد احراز دو مرحله‌ای نادرست است.');
        } else if (data.error === 'INVALID_CHALLENGE') {
          setError('نشست ورود منقضی شده. دوباره از ابتدا وارد شوید.');
          setStep('credentials');
        } else {
          setError('تأیید احراز دو مرحله‌ای ناموفق بود.');
        }
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendSms = async () => {
    if (secondsLeft > 0 || step !== 'sms') return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(adminApiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resendSms: true }),
      });
      const data = await res.json();

      if (!res.ok || !data.requiresSmsOtp) {
        setError('ارسال مجدد کد ممکن نیست. لطفاً از ابتدا وارد شوید.');
        setStep('credentials');
        return;
      }

      applyOtpResponse(data);
      setSmsCode('');
    } catch {
      setError('ارسال مجدد کد با خطا مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  const formSubmit =
    step === 'credentials' ? handleCredentialsSubmit : step === 'sms' ? handleSmsSubmit : handleTotpSubmit;

  const stepHint =
    step === 'sms' ? (
      <>
        <span>کد تأیید به شماره </span>
        <span dir="ltr" className="inline-block font-medium text-foreground">
          {maskedPhone}
        </span>
        <span> ارسال شد.</span>
      </>
    ) : step === 'totp' ? (
      'کد ۶ رقمی اپلیکیشن احراز هویت را وارد کنید.'
    ) : (
      'با ایمیل یا نام کاربری و رمز عبور وارد شوید.'
    );

  return (
    <div className="w-full min-w-0 max-w-[26rem]">
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <BrandLogoMark size="md" src={loginLogo} fallbackSrc={adminLogo} />
        <div className="min-w-0">
          <p className="font-bold text-foreground">{siteName}</p>
          <p className="text-xs text-muted-foreground">{siteTagline}</p>
        </div>
      </div>

      <div className="mb-8 overflow-hidden">
        <p className="section-eyebrow mb-3">ورود امن</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">پنل مدیریت</h1>
        <p className="mt-2 text-start text-sm leading-relaxed text-muted-foreground">{stepHint}</p>
      </div>

      <div className="mb-6 flex gap-2" aria-hidden="true">
        <span className={cn('h-1 flex-1 rounded-full transition-colors', step === 'credentials' ? 'bg-primary' : 'bg-primary/25')} />
        <span className={cn('h-1 flex-1 rounded-full transition-colors', step === 'sms' ? 'bg-primary' : step === 'totp' ? 'bg-primary/25' : 'bg-muted')} />
        <span className={cn('h-1 flex-1 rounded-full transition-colors', step === 'totp' ? 'bg-primary' : 'bg-muted')} />
      </div>

      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">
        {step === 'sms' && sandboxMode && devCode && (
          <div className="mb-5">
            <DevOtpBanner
              code={devCode}
              secondsLeft={secondsLeft}
              onUseCode={() => {
                setSmsCode(devCode);
                setError('');
              }}
            />
          </div>
        )}

        <form onSubmit={formSubmit} className="space-y-5" aria-label="فرم ورود">
          {step === 'credentials' ? (
            <>
              <Field id="identifier" label="ایمیل یا نام کاربری" icon={<UserIcon className="size-4" />}>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  dir="ltr"
                  autoComplete="username"
                  required
                  aria-invalid={Boolean(error)}
                  className="h-12 rounded-xl ps-10 text-left"
                  placeholder="name@magazine.ir"
                />
              </Field>

              <Field id="password" label="رمز عبور" icon={<LockIcon className="size-4" />}>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  aria-invalid={Boolean(error)}
                  className="h-12 rounded-xl pe-11 ps-10 text-left"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </Field>
            </>
          ) : step === 'sms' ? (
            <Field id="smsCode" label="کد پیامکی (۶ رقم)" icon={<ShieldIcon className="size-4" />}>
              <Input
                id="smsCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                dir="ltr"
                autoComplete="one-time-code"
                required
                autoFocus
                aria-invalid={Boolean(error)}
                className="h-12 w-full max-w-full rounded-xl ps-10 text-center text-lg tracking-widest"
                placeholder="••••••"
              />
            </Field>
          ) : (
            <Field id="totpCode" label="کد احراز دو مرحله‌ای (۶ رقم)" icon={<ShieldIcon className="size-4" />}>
              <Input
                id="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                dir="ltr"
                autoComplete="one-time-code"
                required
                autoFocus
                aria-invalid={Boolean(error)}
                className="h-12 w-full max-w-full rounded-xl ps-10 text-center text-lg tracking-widest"
                placeholder="••••••"
              />
            </Field>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm leading-relaxed text-destructive"
            >
              {error}
            </div>
          )}

          <Button type="submit" className="h-12 w-full rounded-xl text-base shadow-md" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Spinner className="size-4" />
                {step === 'credentials' ? 'در حال ورود...' : 'در حال تأیید...'}
              </>
            ) : step === 'credentials' ? (
              'ادامه'
            ) : (
              'تأیید و ورود'
            )}
          </Button>

          {step === 'sms' && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setSmsCode('');
                  setTotpCode('');
                  setDevCode(null);
                  setError('');
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                بازگشت
              </button>
              <button
                type="button"
                onClick={handleResendSms}
                disabled={loading || secondsLeft > 0}
                className={cn(
                  'text-primary transition-opacity',
                  (loading || secondsLeft > 0) && 'pointer-events-none opacity-40',
                )}
              >
                {secondsLeft > 0 ? `ارسال مجدد (${secondsLeft}s)` : 'ارسال مجدد کد'}
              </button>
            </div>
          )}

          {step === 'totp' && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setSmsCode('');
                  setTotpCode('');
                  setDevCode(null);
                  setError('');
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                بازگشت به ابتدا
              </button>
            </div>
          )}
        </form>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        فقط کاربران مجاز می‌توانند وارد شوند.
        <br />
        <a
          href={siteUrl}
          className="mt-1 inline-block font-medium text-primary underline-offset-4 hover:underline"
        >
          بازگشت به وب‌سایت وارگه
        </a>
      </p>
    </div>
  );
}
