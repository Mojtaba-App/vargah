'use client';

import { Button } from '@vargah/ui/components/button';
import { cn } from '@/lib/utils';

type FormActionButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const variantClasses = {
  primary:
    'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25',
  secondary:
    'border border-border bg-background text-foreground shadow-sm hover:bg-muted/80',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
};

export function FormActionButton({
  children,
  loading,
  loadingText,
  variant = 'primary',
  className,
  disabled,
  type = 'submit',
  ...props
}: FormActionButtonProps) {
  return (
    <Button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'h-11 min-w-[8.5rem] rounded-xl px-6 text-sm font-semibold transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-60',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0a12 12 0 0 0 0 24v-4a8 8 0 0 1-8-8Z"
      />
    </svg>
  );
}
