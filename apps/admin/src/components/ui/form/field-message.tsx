import { cn } from '@/lib/utils';

type FieldMessageProps = {
  message?: string;
  className?: string;
};

export function FieldMessage({ message, className }: FieldMessageProps) {
  if (!message) return null;
  return (
    <p role="alert" className={cn('mt-1.5 text-xs text-destructive', className)}>
      {message}
    </p>
  );
}

export function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('mt-1 text-xs text-muted-foreground', className)}>{children}</p>;
}
