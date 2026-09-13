# ADR-004: سئو، ISR و آنالیتیکس

**وضعیت:** پذیرفته‌شده  
**تاریخ:** ۱۴۰۵/۰۶

## زمینه

سایت مجله باید در موتورهای جستجو دیده شود، ساختار داده غنی داشته باشد و آمار بازدید جمع‌آوری شود.

## تصمیم

- بسته `@vargah/seo` برای slug، JSON-LD، URLهای canonical
- **sitemap.xml** و **robots.txt** داینامیک از DB
- **ISR** با `revalidate = 3600` برای صفحات مقاله
- **On-demand revalidation** از admin پس از انتشار (`POST /api/revalidate`)
- **GA4** و **Umami** (اختیاری) + جمع‌آوری داخلی `PageView`
- داشبورد admin: مقالات پربازدید و منابع ترافیک

## پیامدها

### مزایا

- SEO فنی بدون وابستگی به پلاگین
- به‌روزرسانی سریع پس از انتشار بدون rebuild کامل

### معایب

- نیاز به `REVALIDATE_SECRET` و هماهنگی admin ↔ web
- sitemap در build به DB نیاز دارد

### فایل‌های مرجع

`docs/SEO_CHECKLIST.md`, `packages/seo/`, `apps/web/src/app/sitemap.ts`
