'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';

import { createTicket } from '@/actions/tickets';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { TicketCustomerType, TicketPriority } from '@/lib/crm/tickets/constants';

export function NewTicketForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const id = await createTicket({
          subject: formData.get('subject') as string,
          body: formData.get('body') as string,
          customerType: formData.get('customerType') as TicketCustomerType,
          customerName: formData.get('customerName') as string,
          customerEmail: (formData.get('customerEmail') as string) || undefined,
          customerPhone: (formData.get('customerPhone') as string) || undefined,
          priority: (formData.get('priority') as TicketPriority) || TicketPriority.NORMAL,
        });
        setMessage('تیکت ایجاد شد. در حال انتقال...');
        router.push(`/crm/tickets/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ایجاد تیکت ناموفق بود');
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
            <Label htmlFor="subject">موضوع</Label>
            <Input id="subject" name="subject" required disabled={isPending} />
          </div>
          <div>
            <Label htmlFor="body">شرح درخواست</Label>
            <Textarea id="body" name="body" rows={5} required disabled={isPending} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="customerName">نام مشتری</Label>
              <Input id="customerName" name="customerName" required disabled={isPending} />
            </div>
            <div>
              <Label htmlFor="customerType">نوع</Label>
              <select
                id="customerType"
                name="customerType"
                disabled={isPending}
                className="border-border w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value={TicketCustomerType.SUBSCRIBER}>مشترک</option>
                <option value={TicketCustomerType.ADVERTISER}>آگهی‌دهنده</option>
                <option value={TicketCustomerType.GUEST}>مهمان</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="customerEmail">ایمیل</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                dir="ltr"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">موبایل</Label>
              <Input id="customerPhone" name="customerPhone" dir="ltr" disabled={isPending} />
            </div>
          </div>
          <div>
            <Label htmlFor="priority">اولویت</Label>
            <select
              id="priority"
              name="priority"
              disabled={isPending}
              className="border-border w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value={TicketPriority.LOW}>کم</option>
              <option value={TicketPriority.NORMAL}>معمولی</option>
              <option value={TicketPriority.HIGH}>بالا</option>
              <option value={TicketPriority.URGENT}>فوری</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <LoadingButton type="submit" loading={isPending} loadingText="در حال ایجاد تیکت...">
              ایجاد تیکت
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => router.push('/crm/tickets')}
            >
              انصراف
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
