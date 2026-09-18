import * as React from 'react';

import { cn } from '../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-input bg-background text-foreground flex h-11 w-full rounded-md border px-3 py-2 text-sm',
          'placeholder:text-muted-foreground',
          'transition-colors duration-[var(--motion-duration-fast)]',
          'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'border-input bg-background text-foreground flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm',
        'placeholder:text-muted-foreground',
        'transition-colors duration-[var(--motion-duration-fast)]',
        'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn('text-foreground mb-1.5 block text-sm font-medium', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-destructive ms-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
});
Label.displayName = 'Label';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'border-input bg-background text-foreground flex h-11 w-full rounded-md border px-3 py-2 text-sm',
          'transition-colors duration-[var(--motion-duration-fast)]',
          'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = 'Select';

export { Input, Textarea, Label, Select };
