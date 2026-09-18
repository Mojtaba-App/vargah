import { cn } from '@/lib/utils';

type FieldMessageProps = {
  message?: string;
  className?: string;
};

export function FieldMessage({ message, className }: FieldMessageProps) {
  if (!message) return null;
  return (
    <p role="alert" className={cn('text-destructive mt-1.5 text-xs', className)}>
      {message}
    </p>
  );
}

export function FieldHint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn('text-muted-foreground mt-1 text-xs', className)}>{children}</p>;
}
