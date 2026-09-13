import Link from 'next/link';
import { cn } from '@/lib/utils';

export function PageBackLink({
  href,
  label = 'بازگشت',
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-4 transition-transform group-hover:translate-x-0.5"
      >
        <path
          fillRule="evenodd"
          d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </Link>
  );
}
