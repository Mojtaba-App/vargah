'use client';

import { useState, useTransition } from 'react';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import type { CollaborationTypeOption } from '@vargah/business/services-content-types';
import { submitCollaborationApplication } from '@/actions/forms';

const FALLBACK = 'ارسال درخواست همکاری ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.';

function toPublicError(error: unknown): string {
  if (!(error instanceof Error) || !error.message.trim()) return FALLBACK;
  const message = error.message.trim();
  if (/^[A-Z][A-Z0-9_]+$/.test(message)) return FALLBACK;
  if (/zod|prisma|failed|invalid|error|exception|stack/i.test(message)) return FALLBACK;
  return message;
}

type CollaborationApplicationFormProps = {
  types: CollaborationTypeOption[];
  className?: string;
};

export function CollaborationApplicationForm({ types, className }: CollaborationApplicationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const clearFieldError = (name: string) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleInvalid = (event: React.FormEvent<HTMLFormElement>) => {
    const target = event.target;
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
    ) {
      return;
    }
    event.preventDefault();
    let message = 'پر کردن این فیلد لازم است.';
    if (target.validity.typeMismatch && target.type === 'email') {
      message = 'لطفاً یک ایمیل معتبر وارد کنید.';
    } else if (target.validity.patternMismatch && target.name === 'phone') {
      message = 'شماره موبایل معتبر نیست. نمونه: 09123456789';
    } else if (target.validity.tooShort) {
      message = 'متن واردشده کوتاه است.';
    } else if (target.name === 'resume') {
      message = 'لطفاً فایل رزومه را انتخاب کنید.';
    }
    setError('');
    setFieldErrors((prev) => ({ ...prev, [target.name]: message }));
    target.focus();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await submitCollaborationApplication(formData);
        setSubmitted(true);
        e.currentTarget.reset();
        setTimeout(() => setSubmitted(false), 5000);
      } catch (err) {
        setError(toPublicError(err));
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      onInvalid={handleInvalid}
      noValidate
      className={className ?? 'space-y-4'}
      aria-label="فرم درخواست همکاری و رزومه"
    >
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {submitted && (
        <p role="status" className="rounded-xl border border-green-600/30 bg-green-500/5 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          درخواست همکاری و رزومه شما دریافت شد. به‌زودی بررسی می‌کنیم.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="collab-name" required>
            نام و نام‌خانوادگی
          </Label>
          <Input
            id="collab-name"
            name="fullName"
            required
            autoComplete="name"
            minLength={2}
            maxLength={100}
            className="mt-2 rounded-xl"
            disabled={pending}
            onChange={() => clearFieldError('fullName')}
          />
          {fieldErrors.fullName && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.fullName}</p>}
        </div>
        <div>
          <Label htmlFor="collab-email" required>
            ایمیل
          </Label>
          <Input
            id="collab-email"
            name="email"
            type="email"
            required
            dir="ltr"
            autoComplete="email"
            className="mt-2 rounded-xl"
            disabled={pending}
            onChange={() => clearFieldError('email')}
          />
          {fieldErrors.email && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.email}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="collab-phone" required>
            شماره تماس
          </Label>
          <Input
            id="collab-phone"
            name="phone"
            type="tel"
            required
            dir="ltr"
            autoComplete="tel"
            minLength={10}
            maxLength={15}
            pattern="(\+98|0)?9[0-9]{9}"
            title="مثال: 09123456789"
            className="mt-2 rounded-xl"
            disabled={pending}
            placeholder="09123456789"
            onChange={() => clearFieldError('phone')}
          />
          {fieldErrors.phone && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.phone}</p>}
          <p className="mt-1 text-xs text-muted-foreground">موبایل ایران — مثال: 09123456789</p>
        </div>
        <div>
          <Label htmlFor="collab-type" required>
            نوع همکاری
          </Label>
          <Select
            id="collab-type"
            name="collaborationType"
            required
            defaultValue=""
            className="mt-2 rounded-xl"
            disabled={pending || types.length === 0}
            onChange={() => clearFieldError('collaborationType')}
          >
            <option value="" disabled>
              انتخاب کنید
            </option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </Select>
          {fieldErrors.collaborationType && (
            <p className="mt-1.5 text-xs text-destructive">{fieldErrors.collaborationType}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="collab-message" required>
          دربارهٔ همکاری
        </Label>
        <Textarea
          id="collab-message"
          name="message"
          rows={4}
          required
          minLength={20}
          maxLength={4000}
          className="mt-2 rounded-xl"
          disabled={pending}
          placeholder="سابقه، علاقه‌مندی و نحوهٔ همکاری پیشنهادی خود را بنویسید..."
          onChange={() => clearFieldError('message')}
        />
        {fieldErrors.message && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.message}</p>}
      </div>

      <div>
        <Label htmlFor="collab-portfolio">لینک نمونه‌کار (اختیاری)</Label>
        <Input
          id="collab-portfolio"
          name="portfolioUrl"
          type="url"
          dir="ltr"
          maxLength={500}
          className="mt-2 rounded-xl"
          disabled={pending}
          placeholder="https://"
          onChange={() => clearFieldError('portfolioUrl')}
        />
        {fieldErrors.portfolioUrl && (
          <p className="mt-1.5 text-xs text-destructive">{fieldErrors.portfolioUrl}</p>
        )}
      </div>

      <div>
        <Label htmlFor="collab-resume" required>
          فایل رزومه
        </Label>
        <Input
          id="collab-resume"
          name="resume"
          type="file"
          required
          accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="mt-2 rounded-xl pt-2"
          disabled={pending}
          onChange={() => clearFieldError('resume')}
        />
        {fieldErrors.resume && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.resume}</p>}
        <p className="mt-1 text-xs text-muted-foreground">PDF یا Word — حداکثر ۸ مگابایت</p>
      </div>

      <Button type="submit" size="lg" className="rounded-full px-7" disabled={pending || types.length === 0}>
        {pending ? 'در حال ارسال...' : 'ارسال درخواست همکاری'}
      </Button>
      {types.length === 0 && (
        <p className="text-sm text-muted-foreground">
          در حال حاضر نوع همکاری فعالی تعریف نشده است. لطفاً بعداً مراجعه کنید.
        </p>
      )}
    </form>
  );
}
