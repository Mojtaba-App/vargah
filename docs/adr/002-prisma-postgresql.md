# ADR-002: Prisma ORM با PostgreSQL

**وضعیت:** پذیرفته‌شده  
**تاریخ:** ۱۴۰۵/۰۶

## زمینه

نیاز به مدل داده یکپارچه برای مقالات، کاربران، اشتراک، پرداخت، آنالیتیکس و audit log. چند اپ (Next.js، NestJS) به یک دیتابیس دسترسی دارند.

## تصمیم

- **PostgreSQL** به‌عنوان دیتابیس اصلی
- **Prisma 6** در `packages/database` به‌عنوان لایه ORM مشترک
- `DATABASE_URL` در ریشه monorepo
- `db:push` برای توسعه، `db:migrate` برای production

## پیامدها

### مزایا

- Schema واحد و type-safe در TypeScript
- Prisma Studio برای دیباگ
- Seed برای داده نمونه و کاربران تست

### معایب

- Build سایت (sitemap) به DB در زمان build وابسته است
- Prisma 7+ هنوز adopt نشده (ثبات فاز تحویل)

### مدل‌های کلیدی

User, Article, Issue, Subscriber, Payment, DiscountCode, DiscountRedemption, PageView, AuditLog, RefreshToken, IranCity, GeoStatsDaily

تنظیمات کلیدی در `SiteSetting`: `subscription_plans`, `payment_config`, `messaging_config`, `map_config`

فهرست migration و seed: [../DATABASE.md](../DATABASE.md)
