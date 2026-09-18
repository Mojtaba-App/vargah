import * as React from 'react';

import { cn } from '../lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

const variantClasses = {
  default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md',
  outline: 'border border-border bg-background/80 hover:bg-muted text-foreground shadow-sm',
  ghost: 'hover:bg-muted text-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
};

const sizeClasses = {
  default: 'h-10 min-h-10 px-5 text-sm',
  sm: 'h-9 min-h-9 px-4 text-xs',
  lg: 'h-12 min-h-12 px-7 text-sm sm:text-base',
  icon: 'size-10 min-h-10 min-w-10',
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-[color,background-color,box-shadow,transform] duration-[var(--motion-duration-fast)]',
        'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        'active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
