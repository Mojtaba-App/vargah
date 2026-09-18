'use client';

import { useState, useTransition } from 'react';
import { contactFormSchema } from '@vargah/security/schemas';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { submitContactForm } from '@/actions/forms';
import { ProvinceCityField } from '@/components/forms/province-city-field';
import { toPublicUserError, zodFieldErrors } from '@/lib/forms/public-errors';

const FALLBACK_ERROR = 'ارسال پیام ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.';
const CONTACT_FIELDS = ['name', 'email', 'subject', 'body', 'province', 'city'] as const;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<(typeof CONTACT_FIELDS)[number], string>>
  >({});
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [pending, startTransition] = useTransition();

  const clearFieldError = (name: (typeof CONTACT_FIELDS)[number]) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const form = e.currentTarget;
    const formData = new FormData(form);
    const message = String(formData.get('message') ?? '');
    formData.set('body', message);

    const clientParsed = contactFormSchema.safeParse({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      subject: String(formData.get('subject') ?? ''),
      body: message,
      province: province || undefined,
      city: city || undefined,
    });

    if (!clientParsed.success) {
      const fields = zodFieldErrors(clientParsed.error, CONTACT_FIELDS);
      // نگاشت body → message در UI
      setFieldErrors({
        ...fields,
        ...(fields.body ? { body: fields.body } : {}),
      });
      setError(fields.body || fields.name || fields.email || fields.subject || FALLBACK_ERROR);
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitContactForm(formData);
        if (!result.ok) {
          setFieldErrors(result.fields ?? {});
          setError(result.message);
          return;
        }
        setSubmitted(true);
        form.reset();
        setProvince('');
        setCity('');
        setTimeout(() => setSubmitted(false), 4000);
      } catch (err) {
        setError(toPublicUserError(err, FALLBACK_ERROR));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="فرم تماس" noValidate>
      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      {submitted && (
        <p
          role="status"
          className="rounded-xl border border-green-600/30 bg-green-500/5 px-3 py-2 text-sm text-green-700 dark:text-green-400"
        >
          پیام شما دریافت شد. به‌زودی پاسخ می‌دهیم.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name" required>
            نام و نام‌خانوادگی
          </Label>
          <Input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            maxLength={100}
            className="mt-2 rounded-xl"
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
            onChange={() => clearFieldError('name')}
          />
          {fieldErrors.name && (
            <p id="contact-name-error" className="text-destructive mt-1.5 text-xs">
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="contact-email" required>
            ایمیل
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            dir="ltr"
            autoComplete="email"
            maxLength={255}
            className="mt-2 rounded-xl"
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
            onChange={() => clearFieldError('email')}
          />
          {fieldErrors.email && (
            <p id="contact-email-error" className="text-destructive mt-1.5 text-xs">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="contact-subject" required>
          موضوع
        </Label>
        <Input
          id="contact-subject"
          name="subject"
          required
          maxLength={200}
          className="mt-2 rounded-xl"
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.subject)}
          aria-describedby={fieldErrors.subject ? 'contact-subject-error' : undefined}
          onChange={() => clearFieldError('subject')}
        />
        {fieldErrors.subject && (
          <p id="contact-subject-error" className="text-destructive mt-1.5 text-xs">
            {fieldErrors.subject}
          </p>
        )}
      </div>
      <ProvinceCityField
        optional
        province={province}
        city={city}
        onProvinceChange={(value) => {
          setProvince(value);
          clearFieldError('province');
          clearFieldError('city');
        }}
        onCityChange={(value) => {
          setCity(value);
          clearFieldError('city');
        }}
        disabled={pending}
        provinceId="province"
        cityId="city"
      />
      {(fieldErrors.province || fieldErrors.city) && (
        <p className="text-destructive text-xs">{fieldErrors.city || fieldErrors.province}</p>
      )}
      <div>
        <Label htmlFor="contact-message" required>
          پیام
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          maxLength={5000}
          className="mt-2 rounded-xl"
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.body)}
          aria-describedby={fieldErrors.body ? 'contact-message-error' : undefined}
          onChange={() => clearFieldError('body')}
          placeholder="پیام خود را بنویسید..."
        />
        {fieldErrors.body && (
          <p id="contact-message-error" className="text-destructive mt-1.5 text-xs">
            {fieldErrors.body}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="rounded-full px-7" disabled={pending}>
        {pending ? 'در حال ارسال...' : 'ارسال پیام'}
      </Button>
    </form>
  );
}
