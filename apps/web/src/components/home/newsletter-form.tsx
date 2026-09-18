'use client';

import { useState } from 'react';
import type { SiteNewsletterSettings } from '@vargah/business/site-settings';
import { Container } from '@vargah/ui/components/container';
import { Input, Label } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { FadeIn } from '@/components/motion/fade-in';
import { submitNewsletter } from '@/actions/forms';
import { newsletterSchema } from '@vargah/security/schemas';
import { toPublicUserError, zodFieldErrors } from '@/lib/forms/public-errors';

type NewsletterFormProps = {
  content: SiteNewsletterSettings;
};

export function NewsletterForm({ content }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldError('');
    setLoading(true);
    try {
      const client = newsletterSchema.safeParse({ email });
      if (!client.success) {
        const fields = zodFieldErrors(client.error, ['email'] as const);
        setFieldError(fields.email ?? 'لطفاً یک ایمیل معتبر وارد کنید.');
        setError(fields.email ?? 'لطفاً یک ایمیل معتبر وارد کنید.');
        return;
      }

      const result = await submitNewsletter(email);
      if (!result.ok) {
        setFieldError(result.fields?.email ?? '');
        setError(result.message);
        return;
      }
      if (result.alreadySubscribed) {
        setError('این ایمیل قبلاً عضو خبرنامه است.');
        setSubmitted(false);
      } else {
        setSubmitted(true);
        setEmail('');
      }
      setTimeout(() => {
        setSubmitted(false);
        setError('');
        setFieldError('');
      }, 4500);
    } catch (err) {
      setError(toPublicUserError(err, 'ثبت عضویت با خطا مواجه شد. لطفاً بعداً تلاش کنید.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden" aria-labelledby="newsletter-heading">
      <div
        className="from-brand-800 via-brand-700 to-brand-900 absolute inset-0 bg-gradient-to-br"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.14),transparent_45%)]"
        aria-hidden="true"
      />
      <div
        className="bg-brand-400/20 absolute -start-24 bottom-0 size-72 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <Container className="relative py-14 sm:py-20">
        <FadeIn className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div className="text-primary-foreground">
            {content.eyebrow && (
              <p className="text-brand-100/80 text-xs font-semibold tracking-[0.18em] uppercase">
                {content.eyebrow}
              </p>
            )}
            <h2
              id="newsletter-heading"
              className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {content.title}
            </h2>
            <p className="text-brand-50/90 mt-4 max-w-md text-base leading-relaxed">
              {content.description}
            </p>
            {content.privacyNote && (
              <p className="text-brand-100/75 mt-5 flex items-start gap-2 text-sm">
                <ShieldIcon className="mt-0.5 size-4 shrink-0" />
                <span>{content.privacyNote}</span>
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card/95 shadow-brand-950/20 rounded-2xl border border-white/15 p-5 shadow-xl backdrop-blur-sm sm:p-7"
            aria-describedby={
              error ? 'newsletter-error' : submitted ? 'newsletter-success' : undefined
            }
          >
            {error && (
              <p
                id="newsletter-error"
                role="alert"
                className="border-destructive/30 bg-destructive/5 text-destructive mb-4 rounded-xl border px-3 py-2 text-sm"
              >
                {error}
              </p>
            )}
            {submitted && (
              <p
                id="newsletter-success"
                role="status"
                className="border-success/30 bg-success/10 text-success mb-4 rounded-xl border px-3 py-2 text-sm"
              >
                {content.successMessage}
              </p>
            )}

            <Label htmlFor="newsletter-email" className="text-sm font-semibold" required>
              {content.emailLabel}
            </Label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={content.placeholder}
                dir="ltr"
                required
                maxLength={255}
                disabled={loading}
                autoComplete="email"
                aria-invalid={!!error || !!fieldError}
                aria-describedby={fieldError ? 'newsletter-email-error' : undefined}
                className="border-border bg-background h-12 flex-1 rounded-xl"
              />
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="h-12 shrink-0 rounded-xl px-7"
              >
                {loading ? 'در حال ثبت...' : content.ctaLabel}
              </Button>
            </div>
            {fieldError && (
              <p id="newsletter-email-error" className="text-destructive mt-2 text-xs">
                {fieldError}
              </p>
            )}
          </form>
        </FadeIn>
      </Container>
    </section>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
