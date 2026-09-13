'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { headerActionButtonClass } from '@/components/layout/header-action-button';

type HeaderSearchProps = {
  placeholder: string;
  label: string;
  className?: string;
  variant?: 'inline' | 'full';
};

export function HeaderSearch({
  placeholder,
  label,
  className,
  variant = 'inline',
}: HeaderSearchProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(variant === 'full');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open && variant === 'inline') {
      inputRef.current?.focus();
    }
  }, [open, variant]);

  useEffect(() => {
    if (variant !== 'inline' || !open) return;

    const handlePointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, variant]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    router.push(`/articles${params.toString() ? `?${params}` : ''}`);
    setOpen(false);
    setQuery('');
  };

  if (variant === 'full') {
    return (
      <form onSubmit={submit} className={cn('w-full', className)} role="search" aria-label={label}>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-border bg-muted/50 pe-4 ps-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </form>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative z-20 size-9 shrink-0', className)}>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={headerActionButtonClass}
          aria-label={label}
          aria-expanded={false}
        >
          <SearchIcon className="size-[18px]" />
        </button>
      )}

      {open && (
        <form
          onSubmit={submit}
          role="search"
          aria-label={label}
          className="absolute end-0 top-0 z-30 flex h-9 w-[min(18rem,calc(100vw-7rem))] items-center gap-2 rounded-full border border-border bg-background px-3 shadow-lg ring-1 ring-primary/10"
        >
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="بستن جستجو"
          >
            <CloseIcon />
          </button>
        </form>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="size-3.5"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
