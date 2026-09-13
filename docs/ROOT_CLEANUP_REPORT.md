# گزارش فایل‌های ریشه / اسکریپت‌های اضافه — آماده GitHub

تاریخ بررسی: ۱۴۰۴/۰۶/۲۲ (۲۰۲۶-۰۹-۱۳)

این گزارش برای **حذف آگاهانه** است. مواردی که حذف شدند مشخص شده‌اند؛ بقیه را نگه دارید مگر تیم خلافش را بخواهد.

## حذف‌شده در این آماده‌سازی (توصیه‌شده و انجام شد)

| مسیر | دلیل |
|------|------|
| `scripts/fill-env-phase3.mjs` | مسیر مطلق ماشین محلی (`C:\Users\Mojtaba\...`)، نوشتن مستقیم روی `.env`، یک‌بارمصرف فاز ۳ |
| `scripts/apply-phase3-migration.mjs` | همان مشکل مسیر مطلق؛ جایگزین: `pnpm db:migrate:deploy` / `migrate resolve` |
| `docs/ADR-CMS.md` | تکراری؛ محتوا به `docs/adr/006-cms-api-role.md` منتقل شد |
| `docs/SECURITY-DEPLOYMENT-CHECKLIST.md` | ادغام در `docs/SECURITY_CHECKLIST.md` |

## نگه داشته شود (کاربردی)

| مسیر | دلیل |
|------|------|
| `scripts/backup-db.ps1` | پشتیبان روزانه PostgreSQL |
| `scripts/compress-pdf.ps1` | فشرده‌سازی PDF با Ghostscript |
| `.npmrc` / `.prettierrc` / `turbo.json` / `vitest.config.ts` / `playwright.config.ts` | پیکربندی استاندارد monorepo |
| `.github/workflows/*` | CI و ZAP |

## نباید commit شود (gitignore)

| مسیر | نکته |
|------|------|
| `.env` | secret واقعی — فقط `.env.example` |
| `node_modules/`, `.next/`, `.turbo/` | artifact |
| `apps/*/public/uploads/**` (جز `.gitkeep`) | محتوای کاربر؛ روی سرور/S3 بماند |
| `backups/` | dump دیتابیس |
| `.cursor/`, `AGENTS.md`, agent stores | خارج از مشارکت رسمی انسانی |

## محتوای uploads محلی

پوشه‌های `apps/web/public/uploads` و `apps/admin/public/uploads` فایل واقعی دارند. با `.gitignore` جدید commit نمی‌شوند؛ قبل از اولین push یک‌بار `git status` را چک کنید. برای محیط جدید از `.gitkeep` استفاده می‌شود.

## پیشنهاد اختیاری بعدی (حذف نشده)

| مورد | توضیح |
|------|--------|
| عکس‌های mock حجیم در `public` اگر استفاده نمی‌شوند | نیاز به audit جداگانهٔ assets دارد |
| حساب‌های E2E با رمز ثابت در `.env.example` | فقط کامنت؛ برای CI جدا نگه دارید |

## گام بعدی انسانی برای GitHub

طبق [docs/GITHUB.md](./GITHUB.md):

```powershell
git add .
git status   # مطمئن شوید .env نیست
git commit -m "Initial import: Vargah monorepo"
git remote add origin <URL>
git push -u origin main
```

Commit و push را خودتان انجام دهید (بدون agent).
