import { Link } from '@/i18n/navigation';
import { BrandLogoMark } from '@/components/shared/brand-logo';
import { cn } from '@/lib/utils';

type HeaderLogoProps = {
  siteName: string;
  tagline: string;
  logoSrc: string;
  homeAria: string;
  compact?: boolean;
};

export function HeaderLogo({ siteName, tagline, logoSrc, homeAria, compact }: HeaderLogoProps) {
  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
      aria-label={homeAria}
    >
      <BrandLogoMark
        size={compact ? 'sm' : 'md'}
        src={logoSrc}
        className="transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div className={cn('min-w-0 flex-col', compact ? 'hidden sm:flex' : 'flex')}>
        <span
          className={cn(
            'truncate font-bold leading-none tracking-tight text-foreground',
            compact ? 'text-base' : 'text-lg',
          )}
        >
          {siteName}
        </span>
        <span className="mt-1 truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]">
          {tagline}
        </span>
      </div>
    </Link>
  );
}
