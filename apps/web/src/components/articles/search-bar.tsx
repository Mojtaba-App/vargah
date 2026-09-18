'use client';

import { useRouter } from '@/i18n/navigation';
import { Input } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { cn } from '@/lib/utils';
import { useState, useTransition } from 'react';

type SearchBarProps = {
  defaultQuery?: string;
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  defaultQuery = '',
  placeholder = 'جستجو در مقالات...',
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      router.push(`/articles${params.toString() ? `?${params}` : ''}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'surface-card flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center',
        className,
      )}
      role="search"
      aria-label="جستجوی مقالات"
    >
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        dir="rtl"
        aria-label="عبارت جستجو"
        className="h-12 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
      />
      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        className="h-12 shrink-0 rounded-xl px-8"
      >
        {isPending ? '...' : 'جستجو'}
      </Button>
    </form>
  );
}
