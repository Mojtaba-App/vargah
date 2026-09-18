'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_ADMIN_LOGO,
  resolveAdminLogoSrc,
  resolveBrandingAssetSrc,
} from '@/lib/branding-assets';
import { adminPath } from '@/lib/base-path';

const sizeMap = {
  sm: 36,
  md: 40,
  lg: 48,
} as const;

type BrandLogoMarkProps = {
  size?: keyof typeof sizeMap;
  src?: string;
  fallbackSrc?: string;
  className?: string;
  alt?: string;
};

export function BrandLogoMark({
  size = 'md',
  src,
  fallbackSrc,
  className,
  alt = 'لوگو',
}: BrandLogoMarkProps) {
  const dimension = sizeMap[size];
  const primary = resolveBrandingAssetSrc(src, 'admin');
  const fallback = resolveBrandingAssetSrc(fallbackSrc, 'admin') ?? adminPath(DEFAULT_ADMIN_LOGO);
  const [imgSrc, setImgSrc] = useState(primary ?? fallback);

  useEffect(() => {
    setImgSrc(primary ?? fallback);
  }, [primary, fallback]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn('shrink-0 rounded-full object-cover shadow-md ring-1 ring-white/25', className)}
      onError={() => {
        const defaultSrc = adminPath(DEFAULT_ADMIN_LOGO);
        if (imgSrc !== fallback) setImgSrc(fallback);
        else if (imgSrc !== defaultSrc) setImgSrc(defaultSrc);
      }}
    />
  );
}

export { resolveAdminLogoSrc };
