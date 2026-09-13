'use client';

import { useState, useTransition } from 'react';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { submitArticleSubmission } from '@/actions/forms';

const FALLBACK = 'ارسال مقاله ممکن نشد. لطفاً کمی بعد دوباره تلاش کنید.';

function toPublicError(error: unknown): string {
  if (!(error instanceof Error) || !error.message.trim()) return FALLBACK;
  const message = error.message.trim();
  if (/^[A-Z][A-Z0-9_]+$/.test(message)) return FALLBACK;
  if (/zod|prisma|failed|invalid|error|exception|stack/i.test(message)) return FALLBACK;
  return message;
}

type ArticleSubmissionFormProps = {
  className?: string;
};

export function ArticleSubmissionForm({ className }: ArticleSubmissionFormProps) {
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
    } else if (target.validity.tooShort) {
      message = 'متن واردشده کوتاه است.';
    } else if (target.validity.tooLong) {
      message = 'متن واردشده طولانی است.';
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
        await submitArticleSubmission(formData);
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
      aria-label="فرم ارسال مقاله"
    >
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {submitted && (
        <p role="status" className="rounded-xl border border-green-600/30 bg-green-500/5 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          مقاله شما دریافت شد و در صف بررسی تحریریه قرار گرفت.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="author-name" required>
            نام نویسنده
          </Label>
          <Input
            id="author-name"
            name="authorName"
            required
            autoComplete="name"
            minLength={2}
            maxLength={100}
            className="mt-2 rounded-xl"
            disabled={pending}
            onChange={() => clearFieldError('authorName')}
          />
          {fieldErrors.authorName && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.authorName}</p>}
        </div>
        <div>
          <Label htmlFor="author-email" required>
            ایمیل
          </Label>
          <Input
            id="author-email"
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

      <div>
        <Label htmlFor="article-title" required>
          عنوان مقاله
        </Label>
        <Input
          id="article-title"
          name="title"
          required
          minLength={5}
          maxLength={300}
          className="mt-2 rounded-xl"
          disabled={pending}
          onChange={() => clearFieldError('title')}
        />
        {fieldErrors.title && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.title}</p>}
      </div>

      <div>
        <Label htmlFor="article-category" required>
          دسته‌بندی
        </Label>
        <Select
          id="article-category"
          name="category"
          required
          defaultValue=""
          className="mt-2 rounded-xl"
          disabled={pending}
          onChange={() => clearFieldError('category')}
        >
          <option value="" disabled>
            انتخاب کنید
          </option>
          <option value="politics">سیاست و جامعه</option>
          <option value="economy">اقتصاد</option>
          <option value="culture">فرهنگ و هنر</option>
          <option value="technology">فناوری</option>
        </Select>
        {fieldErrors.category && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.category}</p>}
      </div>

      <div>
        <Label htmlFor="article-summary" required>
          خلاصه مقاله
        </Label>
        <Textarea
          id="article-summary"
          name="summary"
          rows={4}
          required
          minLength={20}
          maxLength={5000}
          className="mt-2 rounded-xl"
          disabled={pending}
          placeholder="خلاصهٔ کوتاه از ایده یا متن مقاله..."
          onChange={() => clearFieldError('summary')}
        />
        {fieldErrors.summary && <p className="mt-1.5 text-xs text-destructive">{fieldErrors.summary}</p>}
      </div>

      <div>
        <Label htmlFor="article-file">فایل مقاله (اختیاری)</Label>
        <Input
          id="article-file"
          name="file"
          type="file"
          accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="mt-2 rounded-xl pt-2"
          disabled={pending}
        />
        <p className="mt-1 text-xs text-muted-foreground">PDF یا Word — حداکثر ۸ مگابایت</p>
      </div>

      <Button type="submit" size="lg" className="rounded-full px-7" disabled={pending}>
        {pending ? 'در حال ارسال...' : 'ارسال مقاله'}
      </Button>
    </form>
  );
}
