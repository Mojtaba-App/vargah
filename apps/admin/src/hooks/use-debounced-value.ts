'use client';

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useWorkspaceSearch(initial = '', delayMs = 300) {
  const [value, setValue] = useState(initial);
  const debounced = useDebouncedValue(value, delayMs);
  return { value, debounced, setValue, clear: () => setValue('') };
}
