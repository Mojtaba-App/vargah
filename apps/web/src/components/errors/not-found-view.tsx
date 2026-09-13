import Link from 'next/link';
import { Button } from '@vargah/ui/components/button';
import { BrandLogoMark } from '@/components/shared/brand-logo';

type NotFoundViewProps = {
  siteName?: string;
  logoSrc?: string;
};

export function NotFoundView({
  siteName = 'وارگه',
  logoSrc = '/images/vargah-logo.svg',
}: NotFoundViewProps) {
  return (
    <div className="relative flex min-h-[min(100dvh,100vh)] flex-col overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_55%),radial-gradient(ellipse_at_90%_80%,color-mix(in_oklab,var(--brand-300)_18%,transparent),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]"
        aria-hidden
      />

      <main className="relative z-[1] mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex animate-[fade-in_0.5s_ease-out] flex-col items-center">
          <div className="mb-8 flex items-center gap-3">
            <BrandLogoMark size="lg" src={logoSrc} />
            <span className="text-xl font-bold tracking-tight text-foreground">{siteName}</span>
          </div>

          <p
            className="font-display text-[clamp(4.5rem,18vw,8rem)] font-bold leading-none tracking-tight text-primary/90"
            aria-hidden
          >
            ۴۰۴
          </p>

          <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            این صفحه در شماره نیست
          </h1>
          <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            آدرسی که دنبالش بودید پیدا نشد؛ شاید منتقل شده یا هرگز منتشر نشده باشد. از صفحه اصلی یا
            شماره‌های مجله ادامه دهید.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/">
              <Button size="lg" className="rounded-full px-7">
                بازگشت به صفحه اصلی
              </Button>
            </Link>
            <Link href="/issues">
              <Button variant="outline" size="lg" className="rounded-full px-7">
                مشاهده شماره‌ها
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
