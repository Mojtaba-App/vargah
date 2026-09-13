'use client';

import Image, { type ImageProps } from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@vargah/ui/components/skeleton';

type OptimizedImageProps = ImageProps & {
  wrapperClassName?: string;
};

/** Next Image rejects unconfigured query strings on local paths. */
function normalizeLocalImageSrc(src: ImageProps['src']): ImageProps['src'] {
  if (typeof src !== 'string') return src;
  if (!src.startsWith('/') || src.startsWith('//')) return src;
  const q = src.indexOf('?');
  return q === -1 ? src : src.slice(0, q);
}

export function OptimizedImage({
  wrapperClassName,
  className,
  alt,
  onLoad,
  fill,
  priority,
  src,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(!priority);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resolvedSrc = normalizeLocalImageSrc(src);

  const markLoaded = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const img = wrapperRef.current?.querySelector('img');
    if (img?.complete && img.naturalWidth > 0) {
      markLoaded();
    }
  }, [markLoaded, resolvedSrc]);

  const imageClassName = cn(
    'object-cover transition-opacity duration-300',
    isLoading ? 'opacity-0' : 'opacity-100',
    className,
  );

  if (fill) {
    return (
      <div
        ref={wrapperRef}
        className={cn('relative size-full overflow-hidden bg-muted', wrapperClassName)}
      >
        {isLoading && <Skeleton className="absolute inset-0 z-0 rounded-none" />}
        <Image
          alt={alt}
          fill
          priority={priority}
          src={resolvedSrc}
          className={imageClassName}
          onLoad={(event) => {
            markLoaded();
            onLoad?.(event);
          }}
          {...props}
        />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={cn('relative overflow-hidden bg-muted', wrapperClassName)}>
      {isLoading && <Skeleton className="absolute inset-0 z-0 rounded-none" />}
      <Image
        alt={alt}
        priority={priority}
        src={resolvedSrc}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className,
        )}
        onLoad={(event) => {
          markLoaded();
          onLoad?.(event);
        }}
        {...props}
      />
    </div>
  );
}
