import Link from 'next/link';

import { cn } from '@/lib/utils';

type PaginationLinksProps = {
  page: number;
  totalPages: number;
  total: number;
  /** مسیر پایه بدون query؛ پارامترهای فعلی حفظ می‌شوند به‌جز page */
  basePath: string;
  searchParams?: Record<string, string | string[] | undefined>;
  className?: string;
};

function buildHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
  page: number,
) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'page' || value == null) continue;
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v);
      } else if (value !== '') {
        params.set(key, value);
      }
    }
  }
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function PaginationLinks({
  page,
  totalPages,
  total,
  basePath,
  searchParams,
  className,
}: PaginationLinksProps) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm',
        className,
      )}
    >
      <p className="text-muted-foreground">
        صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')} —{' '}
        {total.toLocaleString('fa-IR')} مورد
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(basePath, searchParams, prev)}
          aria-disabled={page <= 1}
          className={cn(
            'rounded-xl border border-border px-3 py-1.5 transition-colors hover:bg-muted',
            page <= 1 && 'pointer-events-none opacity-40',
          )}
        >
          قبلی
        </Link>
        <Link
          href={buildHref(basePath, searchParams, next)}
          aria-disabled={page >= totalPages}
          className={cn(
            'rounded-xl border border-border px-3 py-1.5 transition-colors hover:bg-muted',
            page >= totalPages && 'pointer-events-none opacity-40',
          )}
        >
          بعدی
        </Link>
      </div>
    </div>
  );
}

export function parsePageParam(raw: string | string[] | undefined, fallback = 1) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
