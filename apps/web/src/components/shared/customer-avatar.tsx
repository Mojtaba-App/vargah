'use client';

import { getUserInitials, resolveAvatarSrc } from '@/lib/user-avatar';
import { cn } from '@/lib/utils';

type CustomerAvatarProps = {
  name: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  ring?: boolean;
};

const sizeMap = {
  xs: { box: 'size-8', text: 'text-[10px]', px: 32 },
  sm: { box: 'size-8', text: 'text-[11px]', px: 32 },
  md: { box: 'size-12', text: 'text-sm', px: 48 },
  lg: { box: 'size-24', text: 'text-2xl', px: 96 },
} as const;

export function CustomerAvatar({
  name,
  avatar,
  size = 'sm',
  className,
  ring = true,
}: CustomerAvatarProps) {
  const config = sizeMap[size];
  const src = resolveAvatarSrc(avatar);

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full bg-primary/10',
        ring && 'ring-2 ring-background',
        config.box,
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={config.px}
          height={config.px}
          className="size-full object-cover"
        />
      ) : (
        <span
          className={cn(
            'flex size-full items-center justify-center font-bold text-primary',
            config.text,
          )}
        >
          {getUserInitials(name)}
        </span>
      )}
    </span>
  );
}
