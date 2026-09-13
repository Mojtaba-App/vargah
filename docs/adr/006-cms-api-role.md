# ADR 006: نقش apps/cms

## وضعیت

ویرایش محتوا و گردش‌کار تحریریه در **Next Admin** (`apps/admin`) و Prisma انجام می‌شود.
`apps/cms` لایه Nest برای API خواندنی و بیدار کردن job است، نه CMS تحریریه دوم.

## تصمیم

1. **Read API عمومی محتوا** — `GET /api/v1/content/articles|issues`
2. **Job wake** — `POST /api/v1/jobs/process` با `CMS_API_KEY`
3. Health / internal status با همان کلید

ویرایش مقاله/شماره/مدیا در Nest پیاده نمی‌شود تا دو منبع حقیقت ایجاد نشود.

## عملیات

- `CMS_API_KEY` و `CRON_SECRET` در env الزامی‌اند
- Worker: cron → `POST /admin/api/cron/jobs` یا `POST /api/v1/jobs/process`
