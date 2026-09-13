# فهرست تست‌های پروژه وارگه

## دستورات

```powershell
pnpm install
pnpm test              # واحد + یکپارچگی (Vitest)
pnpm test:unit         # packages/*/tests
pnpm test:integration  # tests/integration
pnpm test:e2e          # Playwright
pnpm test:coverage     # پوشش کد
```

---

## ۱. تست واحد — Vitest

مسیر: `packages/*/tests/`

### `@vargah/business`

| فایل | سناریو | وضعیت |
|------|--------|--------|
| `subscription.test.ts` | `daysUntil`, یادآور انقضا، قیمت سالانه | ✅ |
| `finance.test.ts` | `calculateMonthlyRevenue` | ✅ |
| `workflow.test.ts` | انتقال وضعیت کمیسیون | ✅ |
| `publication.test.ts` | `resolvePublishedAt`, revalidate | ✅ |
| `zarinpal.test.ts` | `zarinpalTestConnection` — mock API | ✅ |

### `@vargah/security`

| فایل | سناریو | وضعیت |
|------|--------|--------|
| `sanitize.test.ts` | HTML مقاله، plain text | ✅ |
| `phone.test.ts` | normalize، mask، SMS verification، login identifier | ✅ |
| `database-url.test.ts` | `parseDatabaseUrl` | ✅ |
| `login-schema.test.ts` | `loginSchema` — email/username + OTP | ✅ |

### `@vargah/seo`

| فایل | سناریو | وضعیت |
|------|--------|--------|
| `slug.test.ts` | `createSlug`, `ensureUniqueSlug` | ✅ |

### `@vargah/database`

| فایل | سناریو | وضعیت |
|------|--------|--------|
| `seed-modules.test.ts` | `--only` flag، ماژول‌های seed | ✅ |

---

## ۲. تست یکپارچگی

مسیر: `tests/integration/`

| فایل | API | سناریو | وضعیت |
|------|-----|--------|--------|
| `revalidate-api.test.ts` | `POST /api/revalidate` | 401 / 200 | ✅ |
| `analytics-api.test.ts` | `POST /api/analytics/collect` | validation + DB | ✅ |
| `cms-api.test.ts` | CMS health + API key | 401 / 200 | ✅ |

---

## ۳. E2E — Playwright

مسیر: `e2e/`

| فایل | سناریo | وضعیت |
|------|--------|--------|
| `admin-login.spec.ts` | ورود با OTP پیامکی (sandbox) | ✅ |
| `admin-login.spec.ts` | رمز نادرست | ✅ |
| `article-publish.spec.ts` | ایجاد و انتشار مقاله | ✅ |
| `newsletter-signup.spec.ts` | خبرنامه | ✅ |
| `subscription.spec.ts` | صفحه اشتراک | ✅ |

**پیش‌نیاز:** `pnpm db:seed` + PostgreSQL + `pnpm dev --filter=@vargah/web`

---

## ۴. Seed برای تست

```powershell
pnpm db:seed           # کامل — E2E و dev
pnpm db:seed:users     # حداقل برای login
pnpm db:seed:content   # مقالات و شماره
pnpm db:seed:geo       # شهرها (تحلیل جغرافیایی)
pnpm db:seed:settings  # RBAC شامل discount.*
```

---

## ۵. Coverage

```powershell
pnpm test:coverage
```

پوشش هدف: `packages/business`, `packages/security`, `packages/seo` — ≥ ۸۰٪ منطق حساس.

---

## ۶. چک‌لیست دستی

[checklists/accessibility-responsive.md](./checklists/accessibility-responsive.md)

---

## پیشنهاد فاز بعد

| ماژول | سناریو |
|-------|--------|
| `@vargah/security` | `checkRateLimitMemory` |
| Integration | `POST /api/auth/login` admin OTP flow |
| E2E | callback زرین‌پال sandbox |
