'use client';

import { Button } from '@vargah/ui/components/button';
import type { ComponentProps } from 'react';

import { Spinner } from '@/components/ui/feedback/spinner';
import { cn } from '@/lib/utils';

type LoadingButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingText?: string;
};

export function LoadingButton({
  loading,
  loadingText = 'در حال پردازش...',
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button className={cn(className)} disabled={disabled || loading} {...props}>
      {loading && <Spinner className="size-4" />}
      {loading ? loadingText : children}
    </Button>
  );
}
