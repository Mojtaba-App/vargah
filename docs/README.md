# مستندات پروژه وارگه

مرجع فنی و کاربری — **مشارکت انسانی**. راهنمای agent بخشی از این مخزن نیست.

## شروع سریع

| سند                          | توضیح                       |
| ---------------------------- | --------------------------- |
| [SETUP.md](./SETUP.md)       | راه‌اندازی محلی گام‌به‌گام  |
| [DEPLOY.md](./DEPLOY.md)     | استقرار production          |
| [GITHUB.md](./GITHUB.md)     | آماده‌سازی و push به GitHub |
| [DATABASE.md](./DATABASE.md) | Prisma، migration، seed     |
| [../README.md](../README.md) | README ریشه                 |

## فهرست

| مسیر                                                                               | توضیح                          |
| ---------------------------------------------------------------------------------- | ------------------------------ |
| [TESTING.md](./TESTING.md)                                                         | واحد، یکپارچگی، E2E            |
| [guides/admin-user-guide-fa.md](./guides/admin-user-guide-fa.md)                   | راهنمای پنل                    |
| [checklists/accessibility-responsive.md](./checklists/accessibility-responsive.md) | a11y + responsive              |
| [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)                                   | چک‌لیست امنیت go-live          |
| [ROOT_CLEANUP_REPORT.md](./ROOT_CLEANUP_REPORT.md)                                 | گزارش فایل‌های اضافه / حذف‌شده |
| [SEO_CHECKLIST.md](./SEO_CHECKLIST.md)                                             | سئو                            |
| [adr/](./adr/)                                                                     | تصمیمات معماری                 |

## Env

| فایل                      | محل  |
| ------------------------- | ---- |
| `.env.example`            | ریشه |
| `apps/web/.env.example`   | سایت |
| `apps/admin/.env.example` | پنل  |
| `apps/cms/.env.example`   | API  |

سایت فقط **فارسی / RTL** است.

## Seed

```powershell
pnpm db:seed
pnpm db:seed:users
pnpm db:seed:content
pnpm db:seed:crm
pnpm db:seed:geo
pnpm db:seed:templates
pnpm db:seed:settings
pnpm db:seed:analytics
```

## نگهداری مستندات

- تغییر معماری → ADR در `adr/`
- تغییر schema → migration + `DATABASE.md` + `SETUP.md`
- قابلیت پنل → `guides/admin-user-guide-fa.md`
- قبل از release → `TESTING.md` + چک‌لیست‌ها + [DEPLOY.md](./DEPLOY.md)
