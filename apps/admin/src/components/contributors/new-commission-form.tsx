'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';

import { createCommission } from '@/actions/commissions';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { JalaliDateField } from '@/components/ui/form/jalali-date-field';
import { getTodayJalaliParts, jalaliDatePartsToIso } from '@/lib/date/jalali';

type Writer = { id: string; name: string | null };
type Contributor = { id: string; user: { id: string; name: string | null } };

export function NewCommissionForm({
  writers,
  contributors,
}: {
  writers: Writer[];
  contributors: Contributor[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const minDueDate = jalaliDatePartsToIso(getTodayJalaliParts(), 'start');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const id = await createCommission({
          title: formData.get('title') as string,
          description: (formData.get('description') as string) || undefined,
          assigneeId: (formData.get('assigneeId') as string) || undefined,
          contributorId: (formData.get('contributorId') as string) || undefined,
          dueDate: (formData.get('dueDate') as string) || undefined,
        });
        setMessage('سفارش مطلب ایجاد شد. در حال انتقال...');
        router.push(`/contributors/workflow/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ایجاد سفارش ناموفق بود');
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && <StatusBanner type="success" message={message} />}
          {error && <StatusBanner type="error" message={error} />}

          <div>
            <Label htmlFor="title">عنوان سوژه</Label>
            <Input id="title" name="title" required disabled={isPending} />
          </div>
          <div>
            <Label htmlFor="description">شرح / زاویه پوشش</Label>
            <Textarea id="description" name="description" rows={4} disabled={isPending} />
          </div>
          <div>
            <Label htmlFor="assigneeId">نویسنده</Label>
            <select
              id="assigneeId"
              name="assigneeId"
              disabled={isPending}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">بعداً تخصیص</option>
              {writers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="contributorId">پروفایل همکار</Label>
            <select
              id="contributorId"
              name="contributorId"
              disabled={isPending}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.user.name}
                </option>
              ))}
            </select>
          </div>
          <JalaliDateField
            id="new-commission-due-date"
            name="dueDate"
            label="مهلت تحویل"
            disabled={isPending}
            minDate={minDueDate}
            hint="اختیاری — از امروز به بعد، تا پایان روز شمسی"
          />
          <div className="flex flex-wrap gap-2">
            <LoadingButton type="submit" loading={isPending} loadingText="در حال ایجاد...">
              ایجاد سفارش
            </LoadingButton>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => router.push('/contributors/workflow')}
            >
              انصراف
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
