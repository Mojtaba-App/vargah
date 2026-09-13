'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApiPath } from '@/lib/base-path';
import { Input, Label } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { cn } from '@/lib/utils';

type Props = {
  enabled: boolean;
  onEnabled?: () => void;
  redirectOnSuccess?: string;
};

type Step = 'idle' | 'setup' | 'verify' | 'done';

export function TwoFactorSetup({ enabled, onEnabled, redirectOnSuccess }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(enabled ? 'done' : 'idle');
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(adminApiPath('/api/auth/2fa/setup'), { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError('راه‌اندازی 2FA با خطا مواجه شد.');
        return;
      }
      setSecret(data.secret);
      setUri(data.uri);
      setStep('verify');
    } catch {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(adminApiPath('/api/auth/2fa/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, secret }),
      });
      if (!res.ok) {
        setError('کد وارد شده نادرست است.');
        return;
      }
      setStep('done');
      setSecret('');
      setUri('');
      onEnabled?.();
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
        router.refresh();
      }
    } catch {
      setError('خطا در تأیید کد.');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (step === 'done') {
    return (
      <Card className="rounded-2xl border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <path
                fill="currentColor"
                d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4Zm-1 14-3.5-3.5 1.4-1.4L11 12.2l4.6-4.6 1.4 1.4L11 15Z"
              />
            </svg>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">2FA فعال است</h4>
              <Badge variant="default">محافظت شده</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              حساب شما با احراز هویت دو مرحله‌ای محافظت می‌شود. هنگام ورود، کد ۶ رقمی از اپلیکیشن احراز هویت لازم است.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    { id: 'setup', label: 'آماده‌سازی' },
    { id: 'verify', label: 'تأیید کد' },
    { id: 'done', label: 'فعال‌سازی' },
  ] as const;

  const activeIndex = step === 'idle' ? 0 : step === 'verify' ? 1 : 2;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-xs font-semibold',
                i <= activeIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {i + 1}
            </div>
            <span className={cn('text-xs', i <= activeIndex ? 'text-foreground' : 'text-muted-foreground')}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="mx-1 h-px w-6 bg-border" />}
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        اپلیکیشن Google Authenticator، Authy یا مشابه را نصب کنید و کلید را اسکن یا وارد کنید.
      </p>

      {step === 'idle' && (
        <Button type="button" onClick={startSetup} disabled={loading} className="rounded-xl">
          {loading ? 'در حال آماده‌سازی...' : 'شروع راه‌اندازی 2FA'}
        </Button>
      )}

      {step === 'verify' && (
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-medium">کلید دستی</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-muted px-3 py-2 text-sm" dir="ltr">
                {secret}
              </code>
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={copySecret}>
                {copied ? 'کپی شد' : 'کپی کلید'}
              </Button>
            </div>
          </div>
          <p className="break-all text-xs text-muted-foreground" dir="ltr">
            {uri}
          </p>
          <div>
            <Label htmlFor="totp-setup" required>
              کد ۶ رقمی از اپلیکیشن
            </Label>
            <Input
              id="totp-setup"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              dir="ltr"
              className="mt-2 max-w-xs rounded-xl text-center text-lg tracking-widest"
              placeholder="000000"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={verifySetup} disabled={loading || token.length !== 6} className="rounded-xl">
              {loading ? 'در حال تأیید...' : 'فعال‌سازی 2FA'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={loading}
              onClick={() => {
                setStep('idle');
                setSecret('');
                setUri('');
                setToken('');
              }}
            >
              انصراف
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
