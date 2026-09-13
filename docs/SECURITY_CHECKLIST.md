# چک‌لیست امنیتی Go-Live — وارگه

قبل از production کامل کنید. جزئیات استقرار: [DEPLOY.md](./DEPLOY.md)

## احراز هویت و دسترسی

- [ ] `AUTH_SECRET`, `CRON_SECRET`, `CMS_API_KEY`, `REVALIDATE_SECRET` با مقادیر تصادفی جدا
- [ ] `SECRETS_ENCRYPTION_KEY` تنظیم شده (۶۴ hex)
- [ ] رمزهای seed (`admin1234` و …) در production تغییر/حذف شده‌اند
- [ ] 2FA برای نقش‌های حساس (`SUPER_ADMIN`, `EDITOR_IN_CHIEF`, …) فعال است
- [ ] `ADMIN_OTP_SANDBOX` / `CUSTOMER_OTP_SANDBOX` خاموش‌اند
- [ ] Rate limiting ورود و OTP تأیید شده
- [ ] مسیرهای عمومی فقط آنچه لازم است: `/login`, `/api/auth/*`, `/images/*`, `/uploads/branding/*`

## لایه اپلیکیشن

- [ ] Server Actions با Zod
- [ ] HTML با sanitize (DOMPurify)
- [ ] CSRF روی فرم‌ها/API حساس
- [ ] CSP production بدون `unsafe-eval` (nonce در middleware)
- [ ] HSTS / X-Frame-Options / nosniff در production
- [ ] آپلود: magic-byte، نوع مجاز، سقف حجم

## زیرساخت

- [ ] HTTPS + ریدایرکت HTTP
- [ ] WAF/CDN در صورت امکان
- [ ] پشتیبان DB روزانه (`scripts/backup-db.ps1` یا معادل)
- [ ] `.env` جدا برای Dev / Staging / Production و خارج از git
- [ ] چند instance → rate-limit حافظه‌ای کافی نیست؛ store مشترک یا DB
- [ ] دیسک پایدار یا S3 برای uploads

## پرداخت و پیامک

- [ ] `ZARINPAL_SANDBOX=false`
- [ ] callback URL دامنه واقعی
- [ ] SMS واقعی تست شده (لاگین ادمین + OTP مشتری)

## حریم خصوصی

- [ ] فقط داده ضروری
- [ ] شماره کارت ذخیره نمی‌شود
- [ ] سیاست حریم خصوصی به‌روز

## تست نهایی

- [ ] `pnpm typecheck` و `pnpm build`
- [ ] smoke: سایت، لاگین، برندینگ لاگین، یک آپلود رسانه (با auth)
- [ ] revoke session از `/security`
- [ ] (اختیاری) OWASP ZAP — `.github/workflows/security-zap.yml`

## یادآوری WAF

- Rate limit سراسری
- فیلتر SQLi/XSS پایه
- حفاظت بات روی `/api/auth/login`
