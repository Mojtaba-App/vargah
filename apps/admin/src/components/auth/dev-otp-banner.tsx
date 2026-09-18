'use client';

import { useState } from 'react';
import { Button } from '@vargah/ui/components/button';

type DevOtpBannerProps = {
  code: string;
  secondsLeft: number;
  onUseCode: () => void;
};

export function DevOtpBanner({ code, secondsLeft, onUseCode }: DevOtpBannerProps) {
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
        حالت تست — پیامک واقعی ارسال نمی‌شود
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
