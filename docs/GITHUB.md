# آماده‌سازی مخزن برای GitHub

این راهنما **بدون مشارکت agent** است: همه گام‌ها توسط انسان روی ماشین محلی اجرا می‌شود.

---

## پیش‌نیاز امنیتی

1. مطمئن شوید `.env` و هر فایل دارای secret در working tree نیست.
2. `.gitignore` ریشه را بررسی کنید (`.env`, uploads, `.cursor`, …).
3. هرگز `AUTH_SECRET`, کلید SMS، یا dump دیتابیس را push نکنید.

بررسی سریع:

```powershell
# نباید .env را لیست کند
git status --ignored
Get-ChildItem -Recurse -File -Filter ".env" | Select-Object FullName
```

---

## ۱. Init (اگر هنوز git نیست)

```powershell
cd C:\path\to\vargah
git init
git branch -M main
```

---

## ۲. Remote خصوصی (پیشنهادی)

در GitHub یک مخزن **Private** بسازید (بدون README خودکار اگر محلی دارید).

```powershell
git remote add origin git@github.com:<ORG_OR_USER>/vargah.git
# یا HTTPS:
# git remote add origin https://github.com/<ORG_OR_USER>/vargah.git
```

---

## ۳. اولین commit انسانی

```powershell
git add .
git status
# دوباره چک کنید که .env و uploads کاربر stage نشده باشند

git commit -m "Initial import: Vargah monorepo"
git push -u origin main
```

Branch protection پیشنهادی روی `main`: require PR + CI سبز.

---

## ۴. Secrets در GitHub (برای CI / Deploy)

Settings → Secrets and variables → Actions:

| Secret / Variable | کاربرد |
|-------------------|--------|
| (معمولاً برای CI فعلی لازم نیست) | workflow فعلی با env ساختگی build می‌کند |
| `STAGING_SITE_URL` / `STAGING_ADMIN_URL` | workflow ZAP |

**Secrets اپلیکیشن production را در GitHub Actions نگذارید مگر deploy خودکار دارید**؛ ترجیح: secret manager سرور.

---

## ۵. فایل‌های مرتبط مخزن

| فایل | نقش |
|------|-----|
| `.gitignore` | جلوگیری از secret و artifact |
| `.env.example` | الگوی env بدون مقدار واقعی |
| `.github/workflows/ci.yml` | lint / typecheck / build |
| `.github/workflows/security-zap.yml` | اسکن اختیاری |
| `CONTRIBUTING.md` | قوانین مشارکت انسانی |
| `SECURITY.md` | گزارش آسیب‌پذیری |
| `README.md` | نقطه ورود |

---

## ۶. چیزهایی که push نمی‌شوند (عمدی)

- `.env` / `.env.local`
- `node_modules`, `.next`, `.turbo`
- محتوای `public/uploads` (به‌جز `.gitkeep`)
- `.cursor/`, `AGENTS.md`, agent stores
- `backups/`

---

## ۷. بعد از push

1. CI روی push/PR سبز شود.
2. از روی clone تازه طبق [SETUP.md](./SETUP.md) یک‌بار smoke کنید.
3. برای سرور: [DEPLOY.md](./DEPLOY.md).
