'use client';

import { Input } from '@vargah/ui/components/input';
import { cn } from '@/lib/utils';

type SearchInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  'aria-controls'?: string;
  className?: string;
  disabled?: boolean;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

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

export function SearchInput({
  id,
  value,
  onChange,
  placeholder = 'جستجو...',
  'aria-label': ariaLabel = 'جستجو',
  'aria-controls': ariaControls,
  className,
  disabled,
  onFocus,
  onKeyDown,
}: SearchInputProps) {
  return (
    <div className={cn('relative max-w-md', className)}>
      <SearchIcon className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        id={id}
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-controls={ariaControls}
        disabled={disabled}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        className="border-border/80 bg-muted/20 rounded-xl ps-9 pe-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors"
          aria-label="پاک کردن جستجو"
        >
          ✕
        </button>
      )}
    </div>
  );
}
