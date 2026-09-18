'use client';

import { getUserInitials, resolveAvatarSrc } from '@/lib/user-avatar';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  name: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizeMap = {
  sm: { box: 'size-10', text: 'text-xs', px: 40 },
  md: { box: 'size-12', text: 'text-sm', px: 48 },
  lg: { box: 'size-32', text: 'text-3xl', px: 128 },
  xl: { box: 'size-36', text: 'text-4xl', px: 144 },
} as const;

export function UserAvatar({ name, avatar, size = 'md', className }: UserAvatarProps) {
  const config = sizeMap[size];
  const src = resolveAvatarSrc(avatar);

  return (
    <span
      className={cn(
        'bg-primary/10 ring-background relative inline-flex shrink-0 overflow-hidden rounded-full ring-2',
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
            'text-primary flex size-full items-center justify-center font-bold',
            config.text,
          )}
        >
          {getUserInitials(name)}
        </span>
      )}
    </span>
  );
}
