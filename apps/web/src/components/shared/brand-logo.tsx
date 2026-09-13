import Image from 'next/image';
import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 36,
  md: 40,
  lg: 48,
} as const;

type BrandLogoMarkProps = {
  size?: keyof typeof sizeMap;
  src?: string;
  className?: string;
};

export function BrandLogoMark({
  size = 'md',
  src = '/images/vargah-logo.png',
  className,
}: BrandLogoMarkProps) {
  const dimension = sizeMap[size];

  return (
    <Image
      src={src}
      alt=""
      width={dimension}
      height={dimension}
      className={cn(
        'shrink-0 rounded-full object-cover shadow-md ring-1 ring-primary/15',
        className,
      )}
      priority
      unoptimized={src.startsWith('/uploads/')}
      aria-hidden
    />
  );
}
