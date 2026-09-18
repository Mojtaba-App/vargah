'use client';

import { useEffect, useMemo, useState } from 'react';

import type { OsKind } from '@/lib/audit/user-agent';
import { getUserInitials, resolveAvatarSrc } from '@/lib/user-avatar';
import { cn } from '@/lib/utils';

function OsIconSvg({ os, className }: { os: OsKind; className?: string }) {
  switch (os) {
    case 'windows':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M3 5.5 10.5 4.4v7.1H3V5.5Zm0 8.9h7.5v7.1L3 20.5V14.4Zm9-9.1L21 4.1v7.4h-9V5.3Zm0 8.9h9v7.6l-9-1.3v-6.3Z"
          />
        </svg>
      );
    case 'macos':
    case 'ios':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M16.7 13.1c-.03-2.9 2.37-4.3 2.47-4.36-1.34-1.96-3.43-2.23-4.17-2.26-1.78-.18-3.47 1.05-4.37 1.05-.91 0-2.3-1.02-3.78-.99-1.95.03-3.74 1.13-4.74 2.88-2.02 3.5-.52 8.68 1.45 11.52 1 1.43 2.17 3.04 3.72 2.98 1.5-.06 2.06-.97 3.87-.97 1.8 0 2.31.97 3.88.94 1.6-.03 2.61-1.45 3.59-2.89 1.13-1.65 1.6-3.25 1.62-3.33-.04-.02-3.12-1.2-3.15-4.57Z"
          />
          <path
            fill="currentColor"
            d="M14.2 4.2c.82-.99 1.37-2.36 1.22-3.7-1.18.05-2.6.79-3.45 1.77-.76.87-1.42 2.28-1.24 3.62 1.31.1 2.65-.66 3.47-1.69Z"
          />
        </svg>
      );
    case 'android':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M8.2 3.3 7 1.5a.4.4 0 1 1 .7-.4l1.3 2c1.1-.4 2.3-.6 3.5-.6s2.4.2 3.5.6l1.3-2a.4.4 0 1 1 .7.4l-1.2 1.8A8.9 8.9 0 0 1 21 10v5a1 1 0 0 1-1 1h-1v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3H10v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H4a1 1 0 0 1-1-1v-5c0-2.5 1-4.8 2.6-6.5ZM9 14.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          />
        </svg>
      );
    case 'linux':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M12 3c-2.8 0-5 2-5.4 4.7-.5.1-1 .3-1.4.6-.8.6-1.2 1.6-1.2 2.7 0 1.5.7 2.8 1.8 3.5-.2.6-.3 1.2-.3 1.8 0 2.5 1.8 4.6 4.2 5.1.5.8 1.3 1.3 2.2 1.3h2.2c.9 0 1.7-.5 2.2-1.3 2.4-.5 4.2-2.6 4.2-5.1 0-.6-.1-1.2-.3-1.8 1.1-.7 1.8-2 1.8-3.5 0-1.1-.4-2.1-1.2-2.7-.4-.3-.9-.5-1.4-.6C17 5 14.8 3 12 3Zm-2.2 8.8c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9Zm4.4 0c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9Z"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5l-3 3-3-3H6a2 2 0 0 1-2-2V5Z"
          />
        </svg>
      );
  }
}

export function ClientInfoBadge({
  os,
  osLabel,
  browserLabel,
  ipAddress,
  compact,
  className,
}: {
  os: OsKind;
  osLabel: string;
  browserLabel: string;
  ipAddress?: string | null;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('text-muted-foreground flex items-center gap-2 text-xs', className)}>
      <span className="bg-muted text-foreground flex size-6 shrink-0 items-center justify-center rounded-md">
        <OsIconSvg os={os} className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate">
          {osLabel} · {browserLabel}
        </p>
        {!compact && ipAddress ? (
          <p className="truncate font-mono text-[11px]" dir="ltr">
            {ipAddress}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type AuditUserAvatarProps = {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  online?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

export function UserAvatar({
  name,
  email,
  avatar,
  online,
  size = 'md',
  className,
}: AuditUserAvatarProps) {
  const label = (name ?? email ?? 'کاربر').trim() || 'کاربر';
  const src = useMemo(() => resolveAvatarSrc(avatar), [avatar]);
  const [failed, setFailed] = useState(false);
  const box = size === 'sm' ? 'size-8' : 'size-10';
  const text = size === 'sm' ? 'text-[11px]' : 'text-sm';
  const showImage = Boolean(src) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={cn('relative shrink-0', className)}>
      <span
        className={cn(
          'bg-primary/10 ring-background relative inline-flex overflow-hidden rounded-full ring-2',
          box,
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src!}
            alt=""
            width={size === 'sm' ? 32 : 40}
            height={size === 'sm' ? 32 : 40}
            decoding="async"
            className="size-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span
            className={cn(
              'text-primary flex size-full items-center justify-center font-bold',
              text,
            )}
          >
            {getUserInitials(label)}
          </span>
        )}
      </span>
      {online ? (
        <span
          className="border-card absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-emerald-500"
          title="آنلاین"
        />
      ) : null}
    </div>
  );
}
