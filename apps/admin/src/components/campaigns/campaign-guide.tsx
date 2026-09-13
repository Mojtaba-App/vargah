import { Card, CardContent } from '@vargah/ui/components/card';

export function CampaignGuide() {
  return (
    <Card className="rounded-2xl border-sky-200/70 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/20">
      <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-foreground/90">
        <p className="font-semibold">راهنمای ارسال دسته‌ای</p>
        <ol className="list-decimal space-y-1.5 pe-5 text-muted-foreground">
          <li>کانال را انتخاب کنید: ایمیل یا پیامک (مخاطب بر اساس داشتن ایمیل/شماره فیلتر می‌شود).</li>
          <li>
            مخاطب را با سگمنت (فعال، منقضی، دارای خرید، بدون خرید و …) و بازه تاریخ ثبت‌نام یا خرید
            محدود کنید.
          </li>
          <li>
            متن را بنویسید؛ از {'{{name}}'} برای نام مخاطب استفاده کنید. برای ایمیل، موضوع هم لازم است.
          </li>
          <li>
            «افزودن به صف» مخاطبان را می‌سازد؛ کرون
            <code className="mx-1 rounded bg-background px-1.5 py-0.5 text-xs" dir="ltr">
              /api/cron/jobs
            </code>
            یا
            <code className="mx-1 rounded bg-background px-1.5 py-0.5 text-xs" dir="ltr">
              /api/cron/bulk-campaigns
            </code>
            ابتدا گیرندگان را در صف BackgroundJob می‌گذارد و سپس ارسال را با concurrency محدود انجام می‌دهد.
          </li>
          <li>
            قبل از ارسال واقعی، SMTP و SMS را در تنظیمات → پیام‌رسانی فعال و تست کنید.
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
