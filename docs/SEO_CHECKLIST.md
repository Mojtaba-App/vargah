# چک‌لیست سئوی فنی Go-Live — وارگه

## Sitemap و Crawling

- [ ] `/sitemap.xml` در مرورگر باز می‌شود و URLهای منتشرشده را لیست می‌کند
- [ ] `/robots.txt` به sitemap اشاره می‌کند
- [ ] پس از انتشار مقاله/شماره، sitemap با `REVALIDATE_SECRET` بروز می‌شود
- [ ] Sitemap در Google Search Console ثبت شده

## Metadata و Canonical

- [ ] هر مقاله `generateMetadata` با title، description، canonical دارد
- [ ] تگ canonical با `NEXT_PUBLIC_SITE_URL` صحیح تولید می‌شود
- [ ] `metaTitle` و `metaDescription` در پنل برای مقالات مهم پر شده
- [ ] تصویر OG (`ogImage`) با ابعاد ۱۲۰۰×۶۷۵ برای Google Discover تنظیم شده

## Schema.org

- [ ] JSON-LD `NewsArticle` در صفحات مقالات
- [ ] JSON-LD `PublicationIssue` + `Periodical` در صفحات شماره‌ها
- [ ] JSON-LD `Organization` و `WebSite` در layout سایت
- [ ] تست با [Rich Results Test](https://search.google.com/test/rich-results)

## URL و Slug

- [ ] Slugها با `createSlug` (لاتین خوانا) تولید می‌شوند
- [ ] Slug تکراری با پسوند عددی مدیریت می‌شود
- [ ] URLهای فارسی در sitemap با `encodeURIComponent` صحیح هستند

## عملکرد

- [ ] ISR مقالات: `revalidate = 3600` فعال است
- [ ] `NEXT_PUBLIC_CDN_URL` برای استاتیک/تصاویر در production تنظیم شده
- [ ] PDF شماره‌ها با `scripts/compress-pdf.ps1` فشرده شده‌اند
- [ ] Core Web Vitals در PageSpeed Insights قابل قبول است

## تحلیل داده

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` برای GA4 تنظیم شده
- [ ] `NEXT_PUBLIC_GSC_VERIFICATION` برای Search Console تنظیم شده
- [ ] Umami/Plausible (اختیاری): `NEXT_PUBLIC_UMAMI_URL` + `WEBSITE_ID`
- [ ] داشبورد admin: پربازدیدترین مطالب و منابع ترافیک نمایش داده می‌شود
- [ ] CSP اجازه اسکریپت analytics را می‌دهد

## متغیرهای محیطی

```env
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_CDN_URL=https://cdn.example.com
REVALIDATE_SECRET=
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
NEXT_PUBLIC_GSC_VERIFICATION=xxxxxxxx
NEXT_PUBLIC_UMAMI_URL=https://analytics.example.com
NEXT_PUBLIC_UMAMI_WEBSITE_ID=uuid
```

## ابزارهای تست پیش از انتشار

1. Google Search Console — Coverage + Sitemaps
2. Rich Results Test — Schema.org
3. PageSpeed Insights — LCP, CLS, INP
4. `curl -I https://example.com/sitemap.xml` — وضعیت 200
5. View Source — بررسی canonical و JSON-LD
