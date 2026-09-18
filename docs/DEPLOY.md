# استقرار production — وارگه

گام‌به‌گام برای سرور / PaaS. برای توسعه محلی: [SETUP.md](./SETUP.md).

---

## معماری پیشنهادی

```
Internet → Reverse Proxy (HTTPS)
              ├─ /            → apps/web   (Next.js :3000)
              ├─ /admin/*     → rewrite به apps/admin (:3001) یا همان process وب در برخی deployها
              └─ /api/v1/*    → apps/cms   (Nest :4000)  [اختیاری]
PostgreSQL (managed یا self-host)
Object storage S3-compatible (آروان / MinIO) — اختیاری؛ بدون آن آپلود روی دیسک local
```

در monorepo فعلی، در development وب پنل را از `ADMIN_INTERNAL_URL` پروکسی می‌کند. در production همان الگو را با `ADMIN_INTERNAL_URL` داخلی حفظ کنید یا هر دو app را پشت یک دامنه قرار دهید.

---

## ۱. آماده‌سازی سرور

1. Node.js 20+ و pnpm 10.34.5
2. PostgreSQL 14+ با دیتابیس خالی (مثلاً `db_vargah`)
3. دامنه + گواهی TLS (Let’s Encrypt / CDN)
4. فایروال: فقط ۸۰/۴۴۳ عمومی؛ پورت DB فقط داخلی

---

## ۲. Clone و نصب

```bash
git clone <REPO_URL> vargah
cd vargah
corepack enable && corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
```

---

## ۳. متغیرهای محیطی production

از `.env.example` فایل `.env` بسازید (روی سرور؛ **خارج از git**).

### الزامی

| متغیر                    | نکته                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `NODE_ENV`               | `production`                                                                            |
| `DATABASE_URL`           | اتصال PostgreSQL                                                                        |
| `DIRECT_URL`             | در صورت PgBouncer — برای migrate                                                        |
| `AUTH_SECRET`            | `openssl rand -base64 32`                                                               |
| `CRON_SECRET`            | جدا از AUTH                                                                             |
| `CMS_API_KEY`            | جدا                                                                                     |
| `REVALIDATE_SECRET`      | جدا                                                                                     |
| `SECRETS_ENCRYPTION_KEY` | ۶۴ hex char: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AUTH_URL`               | `https://YOUR_DOMAIN/admin/api/auth`                                                    |
| `NEXT_PUBLIC_SITE_URL`   | `https://YOUR_DOMAIN`                                                                   |
| `NEXT_PUBLIC_ADMIN_URL`  | `https://YOUR_DOMAIN/admin`                                                             |
| `ADMIN_INTERNAL_URL`     | آدرس داخلی پنل (مثلاً `http://127.0.0.1:3001`)                                          |

### خاموش در production

```env
# حذف یا false:
# CUSTOMER_OTP_SANDBOX
# ADMIN_OTP_SANDBOX
ZARINPAL_SANDBOX=false
```

### پیشنهادی

- SMS/SMTP از پنل تنظیمات (نه فقط env)
- S3 در صورت چند instance
- `SENTRY_DSN` اختیاری

---

## ۴. دیتابیس

```bash
pnpm db:migrate:deploy
pnpm db:generate
```

**Seed کامل را در production اجرا نکنید** مگر staging جدا. برای اولین ادمین واقعی از seed کاربران فقط روی staging استفاده کنید، سپس رمزها را عوض کنید؛ یا کاربر را دستی بسازید.

اگر تاریخچه migration با DB قبلی ناسازگار است:

```bash
pnpm --filter @vargah/database exec prisma migrate resolve --applied "<migration_name>"
pnpm db:migrate:deploy
```

---

## ۵. Build و اجرا

```bash
pnpm build
```

نمونه process (systemd / PM2 / Docker — بسته به زیرساخت):

```bash
# پنل
pnpm --filter=@vargah/admin start   # معمولاً :3001 با basePath /admin

# سایت
pnpm --filter=@vargah/web start     # :3000

# API (اختیاری)
pnpm --filter=@vargah/cms start     # :4000
```

Reverse proxy نمونهٔ مفهومی:

- `https://domain/` → `127.0.0.1:3000`
- اطمینان از `X-Forwarded-Proto` و `Host`
- آپلودها: دیسک پایدار یا S3

---

## ۶. Cron / Job

حداقل یک زمان‌بند داخلی (هر ۱ دقیقه):

```http
POST /admin/api/cron/jobs
Authorization: Bearer <CRON_SECRET>
```

یا از CMS:

```http
POST /api/v1/jobs/process
```

با `CMS_API_KEY`. یادآور اشتراک و صف `BackgroundJob` به این وابسته است.

---

## ۷. چک‌لیست go-live

- [ ] HTTPS + ریدایرکت HTTP
- [ ] تمام secrets تصادفی و یکتا
- [ ] OTP sandbox خاموش؛ SMS واقعی تست شده
- [ ] زرین‌پال sandbox خاموش؛ callback URL درست
- [ ] رمز ادمین seed عوض شده / حذف شده
- [ ] 2FA نقش‌های حساس
- [ ] پشتیبان DB روزانه (`scripts/backup-db.ps1` یا معادل)
- [ ] `pnpm typecheck` و smoke: سایت، لاگین، آپلود برندینگ لاگین
- [ ] [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)

---

## ۸. به‌روزرسانی نسخه

```bash
git pull
pnpm install --frozen-lockfile
pnpm db:migrate:deploy
pnpm db:generate
pnpm build
# restart processes
```

---

## مرتبط

- [SETUP.md](./SETUP.md) — محلی
- [GITHUB.md](./GITHUB.md) — مخزن
- [DATABASE.md](./DATABASE.md) — schema
- [../SECURITY.md](../SECURITY.md)
