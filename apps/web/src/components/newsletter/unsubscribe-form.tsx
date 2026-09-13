'use client';

import { useState } from 'react';
import { Button } from '@vargah/ui/components/button';
import { Input, Label } from '@vargah/ui/components/input';

import { unsubscribeNewsletterAction } from '@/actions/newsletter';

export function UnsubscribeForm({ initialToken }: { initialToken: string }) {
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const result = await unsubscribeNewsletterAction(token);
      if (!result.ok) {
        setError('لینک لغو عضویت نامعتبر است.');
        return;
      }
      setMessage(
        result.already
          ? 'این ایمیل قبلاً از خبرنامه خارج شده است.'
          : `عضویت «${result.email}» لغو شد.`,
      );
    } catch {
      setError('لغو عضویت ممکن نشد. لطفاً بعداً تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      ) : null}
      <div>
        <Label htmlFor="unsub-token" required>
          کد لغو عضویت
        </Label>
        <Input
          id="unsub-token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          dir="ltr"
          className="mt-2"
          required
        />
      </div>
      <Button type="submit" disabled={loading || !token.trim()} className="w-full rounded-xl">
        {loading ? 'در حال لغو...' : 'لغو عضویت'}
      </Button>
    </form>
  );
}
