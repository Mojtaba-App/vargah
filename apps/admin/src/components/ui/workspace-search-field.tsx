'use client';

import { Label } from '@vargah/ui/components/input';
import { SearchInput } from '@/components/ui/search-input';
import { cn } from '@/lib/utils';

type WorkspaceSearchFieldProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function WorkspaceSearchField({
  id,
  label = 'جستجو',
  value,
  onChange,
  placeholder,
  className,
}: WorkspaceSearchFieldProps) {
  return (
    <div className={cn('max-w-md flex-1', className)}>
      <Label htmlFor={id}>{label}</Label>
      <SearchInput
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full max-w-none"
      />
    </div>
  );
}
