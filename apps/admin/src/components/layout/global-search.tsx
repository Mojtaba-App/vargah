'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { filterAdminSearchIndex } from '@/lib/admin-search-index';
import type { Permission } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type GlobalSearchProps = {
  grantedPermissions: Permission[];
};

export function GlobalSearch({ grantedPermissions }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 200);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => filterAdminSearchIndex(debouncedQuery, grantedPermissions),
    [debouncedQuery, grantedPermissions],
  );

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const onKeyDownPanel = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      navigate(results[activeIndex].href);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <SearchInput
        value={query}
        onChange={(v) => {
          setQuery(v);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDownPanel}
        placeholder="جستجو در پنل... (Ctrl+K)"
        aria-label="جستجوی سراسری پنل"
        className="max-w-md"
      />

      {open && (debouncedQuery || results.length > 0) && (
        <div className="absolute start-0 top-full z-50 mt-2 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">نتیجه‌ای یافت نشد</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto p-1" role="listbox">
              {results.map((item, index) => (
                <li key={item.href} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col rounded-xl px-3 py-2.5 text-start text-sm transition-colors',
                      index === activeIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigate(item.href)}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.group}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            ↑↓ حرکت · Enter انتخاب · Esc بستن
          </div>
        </div>
      )}
    </div>
  );
}
