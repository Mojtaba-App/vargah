'use client';

import { useState, useTransition } from 'react';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { requestDataDeletion } from '@/actions/forms';

export function DataDeletionForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 space-y-4 rounded-xl border border-border p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            await requestDataDeletion(fd);
            setDone(true);
            e.currentTarget.reset();
          } catch {
            setError('ثبت درخواست با خطا مواجه شد.');
          }
        });
      }}
    >
      <h3 className="font-semibold">درخواست حذف داده</h3>
      <p className="text-sm text-muted-foreground">
        مطابق اصول حفاظت از داده، می‌توانید درخواست حذف اطلاعات شخصی خود را ثبت کنید.
      </p>
      <div>
        <Label htmlFor="deletion-email" required>ایمیل ثبت‌شده</Label>
        <Input id="deletion-email" name="email" type="email" required dir="ltr" />
      </div>
      <div>
        <Label htmlFor="deletion-reason">دلیل (اختیاری)</Label>
        <Textarea id="deletion-reason" name="reason" rows={3} maxLength={2000} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'در حال ثبت...' : 'ثبت درخواست حذف'}
      </Button>
      {done && <p className="text-sm text-green-600">درخواست شما ثبت شد و ظرف ۳۰ روز بررسی می‌شود.</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
