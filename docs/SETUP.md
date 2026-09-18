# راه‌اندازی پروژه وارگه

نصب محلی گام‌به‌گام. استقرار سرور: [DEPLOY.md](./DEPLOY.md) · GitHub: [GITHUB.md](./GITHUB.md)

---

## پیش‌نیازها

| ابزار      | نسخه                                         |
| ---------- | -------------------------------------------- |
| Node.js    | 20+ (پیشنهادی ۲۲)                            |
| pnpm       | 10.34.5 (`packageManager` در `package.json`) |
| PostgreSQL | 14+                                          |
| Git        | —                                            |

```powershell
corepack enable
corepack prepare pnpm@10.34.5 --activate
```

بدون PATH: همه دستورات با `npx pnpm@10.34.5`.

---

## ۱. Clone و نصب

```powershell
git clone <REPO_URL> vargah
cd vargah
pnpm install
```

---

## ۲. متغیرهای محیطی

### ریشه monorepo (الزامی)

```powershell
copy .env.example .env
```

حداقل این‌ها را در `.env` پر کنید:

| متغیر                    | توضیح                                   |
| ------------------------ | --------------------------------------- |
| `DATABASE_URL`           | PostgreSQL                              |
| `AUTH_SECRET`            | `openssl rand -base64 32`               |
| `CRON_SECRET`            | جدا از AUTH                             |
| `CMS_API_KEY`            | جدا                                     |
| `REVALIDATE_SECRET`      | جدا                                     |
| `SECRETS_ENCRYPTION_KEY` | ۶۴ کاراکتر hex (رمزنگاری اسرار تنظیمات) |
| `NEXT_PUBLIC_SITE_URL`   | مثلاً `http://localhost:3000`           |
| `NEXT_PUBLIC_ADMIN_URL`  | مثلاً `http://localhost:3000/admin`     |
| `AUTH_URL`               | `http://localhost:3000/admin/api/auth`  |
| `ADMIN_INTERNAL_URL`     | `http://127.0.0.1:3001`                 |

الگو: [`.env.example`](../.env.example)

### اپ‌ها در development

Next.js علاوه بر ریشه، `.env.local` هر app را می‌خواند:

```powershell
copy .env.example apps\web\.env.local
copy .env.example apps\admin\.env.local
```

نمونه‌های کوتاه‌تر:

- [`apps/web/.env.example`](../apps/web/.env.example)
- [`apps/admin/.env.example`](../apps/admin/.env.example)
- [`apps/cms/.env.example`](../apps/cms/.env.example)

> `.env` و `.env.local` هرگز commit نمی‌شوند.

### Sandbox OTP (فقط dev)

در `.env` محلی می‌توانید:

```env
CUSTOMER_OTP_SANDBOX=true
ADMIN_OTP_SANDBOX=true
```

در production این‌ها را حذف/خاموش کنید.

---

## ۳. دیتابیس

Schema: `packages/database/prisma/schema.prisma`  
Client: `@vargah/database`

### ۳.۱ ایجاد دیتابیس

```powershell
psql -U postgres -c "CREATE DATABASE db_vargah;"
```

### ۳.۲ Development سریع

```powershell
pnpm db:push
pnpm db:generate
pnpm db:seed
```

### ۳.۳ مسیر استاندارد (نزدیک به production)

```powershell
pnpm db:migrate:deploy
pnpm db:generate
pnpm db:seed
```

### ۳.۴ فهرست migrationها

| پوشه                                               | موضوع                   |
| -------------------------------------------------- | ----------------------- |
| `20260902120000_message_template_sms_fields`       | فیلدهای SMS الگو        |
| `20260902140000_role_permission_configs`           | ماتریس نقش              |
| `20260902150000_issue_table_of_contents`           | فهرست شماره             |
| `20260902160000_subscriber_advertiser_location`    | استان/شهر CRM           |
| `20260902170000_article_comments`                  | نظرات                   |
| `20260902180000_subscriber_none_delivery_phone`    | enum تحویل              |
| `20260902180001_subscriber_delivery_phone`         | موبایل تحویل            |
| `20260902190000_user_username`                     | نام کاربری              |
| `20260902200000_admin_alert_acks`                  | تأیید اعلان             |
| `20260902210000_iran_cities_geo`                   | شهرهای ایران            |
| `20260902220000_geo_stats_daily`                   | آمار روزانه geo         |
| `20260903000000_geo_phase3`                        | FK آگهی/پیام به شهر     |
| `20260904180000_discount_codes`                    | کد تخفیف + Payment      |
| `20260905120000_message_replies`                   | پاسخ پیام‌ها            |
| `20260906090000_webhook_providers_and_press_roles` | وب‌هوک و نقش‌ها         |
| `20260909120000_customer_sessions`                 | نشست مشتری              |
| `20260909140000_newsletter_and_jobs`               | خبرنامه و BackgroundJob |

جزئیات مدل‌ها: [DATABASE.md](./DATABASE.md)

### ۳.۵ Baseline روی DB از قبل push‌شده

```powershell
pnpm --filter @vargah/database exec prisma migrate resolve --applied "20260909140000_newsletter_and_jobs"
pnpm db:migrate:deploy
```

(نام migration را با آنچه روی DB اعمال شده هماهنگ کنید.)

### ۳.۶ migration جدید در dev

```powershell
pnpm db:migrate
```

اگر `EPERM` روی generate (Windows): همه processهای node را ببندید و `pnpm db:generate`.

---

## ۴. Seed

| ماژول                  | محتوا                                |
| ---------------------- | ------------------------------------ |
| `users`                | admin / editor / writer + موبایل OTP |
| `taxonomy` / `content` | دسته، برچسب، شماره، مقاله            |
| `crm`                  | مشترک، تیکت، …                       |
| `geo`                  | شهرها + آمار نمونه                   |
| `templates`            | الگو ایمیل/پیامک                     |
| `messages`             | پیام‌های نمونه                       |
| `analytics`            | ترافیک نمونه                         |
| `settings`             | برندینگ، درگاه، RBAC                 |

```powershell
pnpm db:seed
pnpm db:seed:users
pnpm db:seed:content
pnpm db:seed:settings
pnpm --filter @vargah/database db:seed -- --only=users,geo,settings
```

| نقش     | ایمیل              | نام کاربری | رمز        |
| ------- | ------------------ | ---------- | ---------- |
| مدیر کل | admin@magazine.ir  | admin      | admin1234  |
| سردبیر  | editor@magazine.ir | editor     | editor1234 |
| نویسنده | writer@magazine.ir | writer     | writer1234 |

فقط برای local/staging.

---

## ۵. اجرا

```powershell
pnpm --filter=@vargah/web dev     # پیشنهادی: سایت :3000 + پنل :3001
pnpm dev                          # Turbo همه پکیج‌ها
pnpm --filter=@vargah/admin dev   # فقط پنل
pnpm --filter=@vargah/cms dev     # API :4000
```

| سرویس           | آدرس                              |
| --------------- | --------------------------------- |
| سایت (fa / RTL) | http://localhost:3000             |
| پنل             | http://localhost:3000/admin/login |
| API             | http://localhost:4000/api/v1      |

---

## ۶. Build محلی

```powershell
pnpm build
```

قبل از build، `DATABASE_URL` و URLهای `NEXT_PUBLIC_*` باید معتبر باشند.

---

## ۷. تست

```powershell
pnpm test
pnpm test:e2e
pnpm exec playwright install chromium
```

[TESTING.md](./TESTING.md)

---

## ۸. عیب‌یابی

| مشکل                       | راه‌حل                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| Authentication failed (DB) | `DATABASE_URL`                                                     |
| database does not exist    | `CREATE DATABASE db_vargah`                                        |
| EPERM generate             | بستن dev → `pnpm db:generate`                                      |
| P3005 / migration تکراری   | `migrate resolve --applied`                                        |
| OTP نمی‌آید                | sandbox در dev؛ SMS در prod                                        |
| پنل 401                    | یکسان بودن `AUTH_SECRET`                                           |
| لوگو/پس‌زمینه لاگین        | فایل در `public/images` یا `uploads/branding`؛ مسیر عمومی در proxy |
| مسیر `/en`                 | سایت فقط فارسی است؛ `/en` ریدایرکت می‌شود                          |

---

## مرتبط

- [DEPLOY.md](./DEPLOY.md)
- [GITHUB.md](./GITHUB.md)
- [DATABASE.md](./DATABASE.md)
- [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)
- [../README.md](../README.md)
