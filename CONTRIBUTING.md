# مشارکت در وارگه

این مخزن برای **توسعه‌دهندگان انسانی** است. مشارکت از طریق agent/AI tooling به‌عنوان جریان رسمی پذیرفته نیست؛ تغییرات باید توسط انسان بررسی، تست و merge شوند.

## پیش از PR

1. از `main` (یا branch پایه تیم) branch بسازید.
2. `pnpm install` و env محلی طبق [docs/SETUP.md](./docs/SETUP.md).
3. تغییرات مرتبط را کوچک و مرورپذیر نگه دارید.
4. اجرا کنید:

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

5. اگر schema عوض شد: migration در `packages/database/prisma/migrations/` + به‌روزرسانی [docs/DATABASE.md](./docs/DATABASE.md).
6. secret، `.env`، آپلود کاربر، و کلید خصوصی را commit نکنید.

## قوانین امنیتی

- رمز و API key فقط در secret manager / env سرور.
- در production sandbox OTP و `ZARINPAL_SANDBOX=true` ممنوع است.
- کد مخرب، bypass احراز هویت، یا حذف کنترل دسترسی پذیرفته نمی‌شود.

## گزارش باگ امنیتی

به [SECURITY.md](./SECURITY.md) مراجعه کنید — issue عمومی برای آسیب‌پذیری حساس باز نکنید.
