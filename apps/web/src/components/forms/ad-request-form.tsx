'use client';

import { useState, useTransition } from 'react';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';
import type { AdPricing } from '@vargah/business/services-content-types';
import { formatPrice } from '@/lib/utils';
import { submitAdRequest } from '@/actions/forms';
import { ProvinceCityField } from '@/components/forms/province-city-field';

const FALLBACK_ERROR = 'ارسال درخواست ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.';

function toPublicAdError(error: unknown): string {
  if (!(error instanceof Error) || !error.message.trim()) return FALLBACK_ERROR;
  const message = error.message.trim();
  if (/^[A-Z][A-Z0-9_]+$/.test(message)) return FALLBACK_ERROR;
  if (/zod|prisma|failed|invalid|error|exception|stack/i.test(message)) return FALLBACK_ERROR;
  return message;
}

type AdTypeOption = { value: string; label: string };

function buildAdTypeOptions(pricingOptions: AdPricing[]): AdTypeOption[] {
  return pricingOptions.map((item) => ({
    value: item.id,
    label: `${item.name} — ${formatPrice(item.price)} تومان`,
  }));
}

type AdRequestFormProps = {
  pricingOptions?: AdPricing[];
};

export function AdRequestForm({ pricingOptions = [] }: AdRequestFormProps) {
  const adTypeOptions = buildAdTypeOptions(pricingOptions);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
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
    const name = target.name || target.id;
    let message = 'لطفاً این فیلد را کامل کنید.';

    if (target.validity.valueMissing) {
      message = 'پر کردن این فیلد لازم است.';
    } else if (target.validity.typeMismatch && target.type === 'email') {
      message = 'لطفاً یک ایمیل معتبر وارد کنید.';
    } else if (target.validity.tooShort) {
      message = 'متن واردشده کوتاه است.';
    } else if (target.validity.tooLong) {
      message = 'متن واردشده طولانی است.';
    } else if (target.validity.patternMismatch) {
      message = target.title || 'مقدار واردشده درست نیست.';
    }

    setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: message }));
    target.focus();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (adTypeOptions.length === 0) {
      setError('در حال حاضر تعرفه‌ای برای درخواست فعال نیست.');
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await submitAdRequest(formData);
        setSubmitted(true);
        e.currentTarget.reset();
        setProvince('');
        setCity('');
        setTimeout(() => setSubmitted(false), 4000);
      } catch (err) {
        setError(toPublicAdError(err));
      }
    });
  };

  return (
    <Card className="rounded-2xl border-border/80 shadow-sm">
      <CardContent className="pt-6">
        <form
          onSubmit={handleSubmit}
          onInvalid={handleInvalid}
          className="space-y-4"
          aria-label="فرم درخواست آگهی"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="company" required>
                نام شرکت / برند
              </Label>
              <Input
                id="company"
                name="company"
                required
                minLength={2}
                maxLength={150}
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.company)}
                onChange={() => clearFieldError('company')}
              />
              {fieldErrors.company && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.company}</p>
              )}
            </div>
            <div>
              <Label htmlFor="ad-contact" required>
                نام مسئول
              </Label>
              <Input
                id="ad-contact"
                name="contactName"
                required
                minLength={2}
                maxLength={100}
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.contactName)}
                onChange={() => clearFieldError('contactName')}
              />
              {fieldErrors.contactName && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.contactName}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ad-phone" required>
                تلفن
              </Label>
              <Input
                id="ad-phone"
                name="phone"
                type="tel"
                required
                dir="ltr"
                autoComplete="tel"
                inputMode="tel"
                placeholder="09123456789"
                title="شماره موبایل معتبر ایران، مثلاً 09123456789"
                pattern="^(?:\+98|0)?9\d{9}$"
                maxLength={14}
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.phone)}
                onChange={() => clearFieldError('phone')}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>
              )}
            </div>
            <div>
              <Label htmlFor="ad-email" required>
                ایمیل
              </Label>
              <Input
                id="ad-email"
                name="email"
                type="email"
                required
                dir="ltr"
                autoComplete="email"
                disabled={pending}
                aria-invalid={Boolean(fieldErrors.email)}
                onChange={() => clearFieldError('email')}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>
          </div>
          <ProvinceCityField
            optional
            province={province}
            city={city}
            onProvinceChange={setProvince}
            onCityChange={setCity}
            disabled={pending}
            provinceId="province"
            cityId="city"
          />
          <div>
            <Label htmlFor="ad-type" required>
              نوع تبلیغ
            </Label>
            <Select
              id="ad-type"
              name="adType"
              required
              defaultValue=""
              disabled={pending || adTypeOptions.length === 0}
              aria-invalid={Boolean(fieldErrors.adType)}
              onChange={() => clearFieldError('adType')}
            >
              <option value="" disabled>
                {adTypeOptions.length === 0 ? 'تعرفه‌ای فعال نیست' : 'انتخاب کنید'}
              </option>
              {adTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {fieldErrors.adType && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.adType}</p>
            )}
          </div>
          <div>
            <Label htmlFor="ad-description">توضیحات</Label>
            <Textarea
              id="ad-description"
              name="description"
              rows={4}
              maxLength={3000}
              disabled={pending}
            />
          </div>
          <Button type="submit" size="lg" disabled={pending || adTypeOptions.length === 0}>
            {pending ? 'در حال ارسال...' : 'ارسال درخواست'}
          </Button>
          {submitted && (
            <p role="status" className="text-sm text-green-600">
              درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
