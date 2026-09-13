# دیتابیس وارگه

مرجع schema، migration و seed برای `packages/database`.

---

## پشته

| جزء | مقدار |
|------|--------|
| موتور | PostgreSQL 14+ |
| ORM | Prisma 6 (`@prisma/client`) |
| پکیج | `@vargah/database` |
| Schema | `packages/database/prisma/schema.prisma` |
| Migrations | `packages/database/prisma/migrations/` |
| Seed | `packages/database/prisma/seed.ts` + `prisma/seeds/` |

متغیر اتصال: `DATABASE_URL` در ریشه monorepo (`.env`).

---

## دستورات

از ریشه پروژه:

```powershell
pnpm db:push              # همگام‌سازی schema در dev (بدون فایل migration)
pnpm db:migrate           # ساخت/اعمال migration در dev
pnpm db:migrate:deploy    # اعمال migrationها در production
pnpm db:generate          # تولید Prisma Client
pnpm db:studio            # UI مرور داده
pnpm db:seed              # seed کامل
pnpm db:seed:geo          # فقط geo
```

معادل مستقیم پکیج:

```powershell
pnpm --filter @vargah/database db:generate
```

---

## دامنه مدل‌ها (خلاصه)

### محتوا و کاربران
`User`, `Article`, `Issue`, `Category`, `Tag`, `Media`, `ArticleComment`, `AuditLog`, `RolePermissionConfig`

### مشتریان و فروش
`Subscriber`, `Advertiser`, `AdCampaign`, `Payment`, `DiscountCode`, `DiscountRedemption`, `Ticket`, `Message`

### همکاران
`Contributor`, `ContributorTask`, `ArticleCommission`, …

### جغرافیا و آمار
`IranCity`, `GeoStatsDaily`, `PageView`, …

### تنظیمات (کلید/مقدار در `SiteSetting`)
| کلید | محتوا |
|------|--------|
| `site_config` | برندینگ، فوتر، تماس |
| `messaging_config` | SMTP / SMS |
| `payment_config` | درگاه زرین‌پال |
| `subscription_plans` | پلن‌های اشتراک (قیمت، تخفیف محصول، فعال) |
| `map_config` | نقشه و لایه‌ها |
| `services_content` / `about_content` | صفحات سایت |

---

## تخفیف و اشتراک

### `DiscountCode`
- نوع: `PERCENT` | `FIXED`
- محدوده: `ALL` (همه پلن‌ها) | `SELECTED` (آرایه `planSlugs`)
- محدودیت‌ها: `maxUses`, `maxUsesPerUser`, `minSubtotal`, `startsAt`, `endsAt`, `isActive`

### `DiscountRedemption`
ثبت یک‌بار استفاده به ازای هر `Payment` موفق (cascade با حذف کد/پرداخت).

### `Payment`
فیلدهای اختیاری: `discountCode`, `discountAmount`, `subtotalAmount`.

### منطق کسب‌وکار
در `@vargah/business/discounts` و `@vargah/business/subscription-plans` — محاسبه قیمت فروش پلن، پیش‌نمایش کوپن، اعمال در checkout.

### پنل ادمین
- **مدیریت محتوا → پلن‌های اشتراک** (`/subscription-plans`)
- **مدیریت محتوا → تخفیف‌ها** (`/discounts`) — تاریخ/ساعت اعتبار شمسی
- **تنظیمات → درگاه پرداخت** — فقط پیکربندی زرین‌پال
- دسترسی‌ها: `discount.view`, `discount.manage`, `settings.view`, `settings.edit`

---

## فهرست Migration

| پوشه | موضوع |
|------|--------|
| `20260902120000_message_template_sms_fields` | فیلدهای SMS الگو |
| `20260902140000_role_permission_configs` | ماتریس نقش |
| `20260902150000_issue_table_of_contents` | فهرست مطالب شماره |
| `20260902160000_subscriber_advertiser_location` | موقعیت CRM |
| `20260902170000_article_comments` | نظرات |
| `20260902180000_subscriber_none_delivery_phone` | enum تحویل |
| `20260902180001_subscriber_delivery_phone` | موبایل تحویل |
| `20260902190000_user_username` | نام کاربری |
| `20260902200000_admin_alert_acks` | ack اعلان ادمین |
| `20260902210000_iran_cities_geo` | `iran_cities` |
| `20260902220000_geo_stats_daily` | آمار روزانه geo |
| `20260903000000_geo_phase3` | FK آگهی/پیام به شهر |
| `20260904180000_discount_codes` | کد تخفیف + redemption + فیلدهای Payment |
| `20260905120000_message_replies` | پاسخ پیام‌ها |
| `20260906090000_webhook_providers_and_press_roles` | وب‌هوک و نقش‌های مطبوعاتی |
| `20260909120000_customer_sessions` | نشست مشتری |
| `20260909140000_newsletter_and_jobs` | خبرنامه و BackgroundJob |

### دیتابیس از قبل با `db push`

اگر جدول‌ها از قبل وجود دارند و migration همان تغییر را تکرار می‌کند:

```powershell
pnpm --filter @vargah/database exec prisma migrate resolve --applied "20260909140000_newsletter_and_jobs"
pnpm db:migrate:deploy
```

(نام migration را با وضعیت واقعی DB هماهنگ کنید.)

---

## Seed ماژولار

| ماژول | اسکریپت کوتاه | فایل |
|--------|----------------|------|
| `users` | `pnpm db:seed:users` | `seeds/users.ts` |
| `taxonomy` + `content` | `pnpm db:seed:content` | `taxonomy.ts`, `content.ts` |
| `crm` | `pnpm db:seed:crm` | `crm.ts` |
| `geo` | `pnpm db:seed:geo` | `iran-cities.ts`, `geo-stats.ts` |
| `templates` | `pnpm db:seed:templates` | `templates.ts` |
| `messages` | (با `--only=messages`) | `messages.ts` |
| `analytics` | `pnpm db:seed:analytics` | `analytics.ts` |
| `settings` | `pnpm db:seed:settings` | `settings.ts` (RBAC شامل تخفیف) |

سفارشی:

```powershell
pnpm --filter @vargah/database db:seed -- --only=users,geo,settings
```

---

## عیب‌یابی کوتاه

| خطا | اقدام |
|------|--------|
| EPERM روی `generate` | بستن node/dev و تکرار `pnpm db:generate` |
| P3005 | baseline با `migrate resolve --applied` |
| enum/مدل جدید در runtime نیست | `db:generate` + ری‌استارت dev |
| دسترسی تخفیف نیست | seed مجدد `settings` یا ماتریس نقش در پنل |

راه‌اندازی کامل: [SETUP.md](./SETUP.md)
