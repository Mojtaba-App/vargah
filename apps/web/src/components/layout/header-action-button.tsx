import { cn } from '@/lib/utils';

/** کلاس مشترک دکمه‌های آیکن هدر — همه ۳۶×۳۶ و هم‌تراز */
export const headerActionButtonClass =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

type HeaderActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function HeaderActionButton({ className, children, ...props }: HeaderActionButtonProps) {
  return (
    <button type="button" className={cn(headerActionButtonClass, className)} {...props}>
      {children}
    </button>
  );
}
