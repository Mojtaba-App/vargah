'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { isNextRedirect } from '@/lib/action-state';

export function useActionFeedback() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clear = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  const run = useCallback(
    (fn: () => Promise<void>, successMessage: string) => {
      clear();
      startTransition(async () => {
        try {
          await fn();
          setMessage(successMessage);
          router.refresh();
        } catch (err) {
          if (isNextRedirect(err)) throw err;
          setError(err instanceof Error ? err.message : 'خطا در انجام عملیات');
        }
      });
    },
    [clear, router],
  );

  return { message, error, isPending, run, clear, setMessage, setError };
}
