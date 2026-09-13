# ADR-001: Monorepo با pnpm workspaces و Turborepo

**وضعیت:** پذیرفته‌شده  
**تاریخ:** ۱۴۰۵/۰۶

## زمینه

پروژه شامل سایت عمومی، پنل مدیریت، API و چند بسته مشترک (UI، دیتابیس، امنیت) است. نیاز به اشتراک کد، یکسان‌سازی وابستگی‌ها و build موازی داریم.

## تصمیم

- ساختار **monorepo** با `pnpm workspaces`
- **Turborepo** برای cache و orchestration تسک‌های `build`، `dev`، `lint`، `typecheck`
- **catalog** در `pnpm-workspace.yaml` برای نسخه‌های مشترک (React، Next، TypeScript)

## پیامدها

### مزایا

- یک `pnpm install` برای همه اپ‌ها
- تغییر در `@vargah/ui` فوراً در web و admin دیده می‌شود
- CI سریع‌تر با turbo cache

### معایب

- پیچیدگی اولیه برای توسعه‌دهندگان تازه‌وارد
- نیاز به آشنایی با `--filter` در pnpm

### ساختار

```
apps/web, apps/admin, apps/cms
packages/ui, database, security, seo, business
```
