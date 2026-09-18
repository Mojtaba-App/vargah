# ماهنامه وارگه

وب‌سایت و پنل مدیریت ماهنامه — monorepo با **pnpm workspaces** و **Turborepo**.

| سند                                    | موضوع                          |
| -------------------------------------- | ------------------------------ |
| [docs/SETUP.md](./docs/SETUP.md)       | راه‌اندازی گام‌به‌گام محلی     |
| [docs/DEPLOY.md](./docs/DEPLOY.md)     | استقرار production             |
| [docs/GITHUB.md](./docs/GITHUB.md)     | آماده‌سازی و push به GitHub    |
| [docs/DATABASE.md](./docs/DATABASE.md) | Prisma، migration، seed        |
| [SECURITY.md](./SECURITY.md)           | سیاست امنیت و گزارش آسیب‌پذیری |
| [docs/](./docs/README.md)              | فهرست کامل مستندات             |

سایت **فقط فارسی و RTL** است (`locale: fa`).

---

## پیش‌نیازها

| ابزار      | نسخه                                 |
| ---------- | ------------------------------------ |
| Node.js    | **20+** (پیشنهادی ۲۲ LTS)            |
| pnpm       | **10.34.5** (مطابق `packageManager`) |
| PostgreSQL | **14+**                              |
| Git        | ۲+                                   |

```powershell
corepack enable
corepack prepare pnpm@10.34.5 --activate
```

اگر `pnpm` در PATH نبود: `npx pnpm@10.34.5 …`

---

## راه‌اندازی سریع

```powershell
git clone <REPO_URL> vargah
cd vargah
pnpm install
copy .env.example .env
# DATABASE_URL و AUTH_SECRET و SECRETS_ENCRYPTION_KEY را پر کنید

psql -U postgres -c "CREATE DATABASE db_vargah;"
pnpm db:migrate:deploy   # یا در dev: pnpm db:push
pnpm db:generate
pnpm db:seed             # فقط محیط توسعه / staging

pnpm --filter=@vargah/web dev
```

جزئیات: **[docs/SETUP.md](./docs/SETUP.md)**

---

## آدرس‌های محلی

| سرویس         | آدرس                              |
| ------------- | --------------------------------- |
| سایت          | http://localhost:3000             |
| پنل           | http://localhost:3000/admin/login |
| API (CMS)     | http://localhost:4000/api/v1      |
| Prisma Studio | `pnpm db:studio`                  |

`pnpm --filter=@vargah/web dev` سایت (:3000) و پنل (:3001) را با هم بالا می‌آورد؛ مسیر `/admin` از طریق rewrite وب به پنل می‌رسد.

### حساب‌های seed (فقط local / staging)

| نقش     | ایمیل / نام کاربری              | رمز          |
| ------- | ------------------------------- | ------------ |
| مدیر کل | `admin@magazine.ir` / `admin`   | `admin1234`  |
| سردبیر  | `editor@magazine.ir` / `editor` | `editor1234` |
| نویسنده | `writer@magazine.ir` / `writer` | `writer1234` |

ورود: ایمیل یا نام کاربری + رمز → کد OTP (در development روی صفحه نمایش داده می‌شود).  
**هرگز** این رمزها را در production نگه ندارید.

---

## ساختار

```
apps/
  web/      Next.js — سایت عمومی (fa / RTL)
  admin/   Next.js — پنل (basePath /admin)
  cms/     NestJS — API خواندنی + بیدار کردن job
packages/
  database/  Prisma + migrations + seed
  security/  Auth helpers, CSP, OTP, schemas
  business/  اشتراک، تخفیف، پرداخت، storage
  seo/       JSON-LD و URL
  ui/        Design system + Vazirmatn
docs/        مستندات انسانی
e2e/         Playwright
tests/       یکپارچگی
```

---

## اسکریپت‌های اصلی

```powershell
pnpm dev                 # Turbo — همه سرویس‌ها
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e

pnpm db:migrate:deploy
pnpm db:generate
pnpm db:seed
pnpm db:seed:users
pnpm db:seed:settings
```

---

## امنیت (خلاصه)

- فایل `.env` را **هرگز** commit نکنید (در `.gitignore` است).
- قبل از production: [docs/DEPLOY.md](./docs/DEPLOY.md) و [docs/SECURITY_CHECKLIST.md](./docs/SECURITY_CHECKLIST.md).
- گزارش آسیب‌پذیری: [SECURITY.md](./SECURITY.md).
- این مخزن برای **مشارکت انسانی** است؛ فایل‌ها و راهنماهای agent/AI tooling عمداً در git نیستند.

---

## مشارکت

راهنما: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## عیب‌یابی کوتاه

| مشکل                   | اقدام                                                    |
| ---------------------- | -------------------------------------------------------- |
| DB auth failed         | `DATABASE_URL` در `.env` ریشه                            |
| EPERM روی generate     | بستن dev server → `pnpm db:generate`                     |
| لوگو لاگین لود نمی‌شود | مسیرهای `/images` و `/uploads/branding` باید عمومی باشند |
| migration تکراری       | `prisma migrate resolve --applied "<name>"`              |

جزئیات: [docs/SETUP.md](./docs/SETUP.md)
