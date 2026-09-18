# ADR-005: بسته منطق کسب‌وکار (`@vargah/business`)

**وضعیت:** پذیرفته‌شده  
**تاریخ:** ۱۴۰۵/۰۶

## زمینه

منطق حساس (محاسبه اشتراک، درآمد ماهانه، گردش کار کمیسیون، انتشار مقاله) در admin تکرار یا پراکنده بود و قابل تست واحد نبود.

## تصمیم

- استخراج منطق خالص به `packages/business`
- بدون وابستگی به Next.js یا NestJS
- تست واحد با Vitest
- admin از این بسته import می‌کند (`finance`, `subscription`, `workflow`, `publication`)

## پیامدها

### مزایا

- تست‌پذیری بالا
- یک منبع حقیقت برای قوانین کسب‌وکار
- امکان استفاده در CMS یا اسکریپت‌های batch

### معایب

- لایه اضافی — فقط برای منطق غیر-UI

### ماژول‌ها

| فایل                                         | مسئولیت                     |
| -------------------------------------------- | --------------------------- |
| `finance.ts`                                 | `calculateMonthlyRevenue`   |
| `subscription.ts`                            | انقضا، یادآور، قیمت سالانه  |
| `subscription-plans.ts`                      | پلن‌های اشتراک، تخفیف محصول |
| `subscription-cart.ts`                       | سبد اشتراک (TTL)            |
| `discounts.ts`                               | کوپن، قیمت نهایی، پیش‌نمایش |
| `workflow.ts`                                | `canTransition` کمیسیون     |
| `publication.ts`                             | `publishedAt`, revalidate   |
| `zarinpal.ts` / `subscription-activation.ts` | پرداخت و فعال‌سازی          |
