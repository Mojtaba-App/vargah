# امنیت — ماهنامه وارگه

## گزارش آسیب‌پذیری

اگر مشکل امنیتی پیدا کردید:

1. **Issue عمومی GitHub باز نکنید.**
2. جزئیات را خصوصی به نگهدارنده پروژه ایمیل کنید (آدرس را در تنظیمات سازمان/مخزن ثبت کنید).
3. شامل: نسخه/commit، گام‌های بازتولید، اثر، و در صورت امکان PoC محدود.

پاسخ معمول طی چند روز کاری؛ برای موارد بحرانی اولویت بالاتر.

## انتظارات امنیتی (production)

- Secrets قوی: `AUTH_SECRET`, `CRON_SECRET`, `CMS_API_KEY`, `REVALIDATE_SECRET`, `SECRETS_ENCRYPTION_KEY`
- HTTPS اجباری؛ HSTS پشت reverse proxy
- OTP sandbox خاموش؛ درگاه واقعی با `ZARINPAL_SANDBOX=false`
- رمزهای seed عوض شده؛ 2FA برای نقش‌های حساس
- آپلود با magic-byte و نوع مجاز؛ CSP بدون `unsafe-eval` در production

چک‌لیست کامل: [docs/SECURITY_CHECKLIST.md](./docs/SECURITY_CHECKLIST.md) · استقرار: [docs/DEPLOY.md](./docs/DEPLOY.md)
