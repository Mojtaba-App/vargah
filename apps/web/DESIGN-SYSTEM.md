# Design System — ماهنامه وارگه

سیستم طراحی مبتنی بر **Design Tokens** (CSS Variables + Tailwind v4 `@theme`).

## ساختار توکن‌ها

| دسته | محل | توضیح |
|------|-----|--------|
| رنگ‌های semantic | `:root` / `.dark` | `--background`, `--primary`, `--muted`, ... |
| پالت brand | `:root` / `.dark` | `--brand-50` تا `--brand-900` |
| تایپوگرافی | `@theme` | `--text-xs` تا `--text-5xl` + line-height |
| فاصله‌گذاری | `:root` | `--section-padding`, `--container-padding` |
| Radius | `:root` | `--radius` + `--radius-sm/md/lg/xl` |
| Shadow | `:root` / `.dark` | `--shadow-xs` تا `--shadow-xl` |
| Motion | `:root` | `--motion-duration-*`, `--motion-ease` |

## فایل‌های کلیدی

- `packages/ui/src/globals.css` — توکن‌ها + base styles + utilities
- `packages/ui/src/components/` — Button, Input, Card, Badge, Skeleton
- `apps/web/src/components/providers/theme-provider.tsx` — Dark/Light (next-themes)
- `apps/web/src/components/motion/fade-in.tsx` — Framer Motion + reduced-motion
- `apps/web/src/components/shared/optimized-image.tsx` — AVIF/WebP + skeleton

## Dark Mode

- کلاس `.dark` روی `<html>`
- ذخیره در `localStorage` با کلید `vargah-theme`
- دکمه toggle در Header + Mobile Nav

## Accessibility (WCAG 2.2 AA)

- Skip link → `#main-content`
- `:focus-visible` با `--ring`
- `aria-*` روی فرم‌ها، منو، نظرات
- `prefers-reduced-motion` — غیرفعال‌سازی انیمیشن
- کنtrast ratio: primary روی background ≥ 4.5:1

## Performance

- `next/image` formats: AVIF → WebP
- Lazy load: PdfViewer (dynamic import)
- Skeleton loading: `loading.tsx` + OptimizedImage
- `priority` فقط برای LCP images (hero, article cover)

## Utility Classes

- `.section-padding` — padding عمودی سکشن‌ها
- `.card-interactive` — hover card با shadow
- `.prose-content` — typography مقالات long-form
- `.text-balance` — headline wrapping
- `.animate-shimmer` — skeleton animation
