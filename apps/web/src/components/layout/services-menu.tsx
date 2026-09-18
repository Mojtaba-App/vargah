'use client';

import { useEffect, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import type { ServiceNavItem } from '@vargah/business/services-content-types';
import { cn } from '@/lib/utils';

type ServicesMenuProps = {
  label: string;
  items: ServiceNavItem[];
};

export function ServicesMenu({ label, items }: ServicesMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = items.some((link) => pathname === link.href || pathname.startsWith(link.href));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive || open
            ? 'text-primary'
            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
        )}
      >
        {label}
        <ChevronIcon className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="border-border bg-card/95 absolute start-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border p-2 shadow-xl backdrop-blur-xl"
          role="menu"
        >
          <div className="space-y-1">
            {items.map((item) => (
              <ServiceMenuCard
                key={item.href}
                item={item}
                active={pathname === item.href || pathname.startsWith(item.href)}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceMenuCard({
  item,
  active,
  onNavigate,
}: {
  item: ServiceNavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      role="menuitem"
      onClick={onNavigate}
      className={cn(
        'group hover:bg-muted/70 flex gap-3 rounded-xl border border-transparent p-3 transition-colors',
        active && 'border-primary/20 bg-primary/5',
      )}
    >
      <ServiceIconWell icon={item.icon} />
      <div className="min-w-0 flex-1">
        <p className="text-foreground group-hover:text-primary text-sm leading-snug font-semibold">
          {item.label}
        </p>
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
          {item.description}
        </p>
      </div>
    </Link>
  );
}

export function ServiceIconWell({
  icon,
  size = 'md',
}: {
  icon: ServiceNavItem['icon'];
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'bg-primary/10 text-primary flex shrink-0 items-center justify-center rounded-xl',
        size === 'sm' ? 'size-9 rounded-lg' : 'size-10',
      )}
    >
      <ServiceIcon icon={icon} className={size === 'sm' ? 'size-4' : 'size-5'} />
    </div>
  );
}

export function ServiceIcon({
  icon,
  className,
}: {
  icon: ServiceNavItem['icon'];
  className?: string;
}) {
  const props = {
    className,
    'aria-hidden': true as const,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (icon) {
    case 'collaborate':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'advertising':
      return (
        <svg {...props}>
          <path d="m3 11 18-5v12L3 13v-2z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      );
    case 'subscription':
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8M8 11h6" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
  }
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
