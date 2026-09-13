import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SocialNetwork =
  | 'instagram'
  | 'telegram'
  | 'whatsapp'
  | 'twitter'
  | 'eitaa'
  | 'linkedin';

export type SocialLinksMap = Partial<Record<SocialNetwork, string>>;

type SocialLinksProps = {
  links: SocialLinksMap;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
};

const networkMeta: Record<
  SocialNetwork,
  { label: string; hover: string; icon: (className?: string) => ReactNode }
> = {
  instagram: {
    label: 'اینستاگرام',
    hover: 'hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400',
    icon: InstagramIcon,
  },
  telegram: {
    label: 'تلگرام',
    hover: 'hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400',
    icon: TelegramIcon,
  },
  whatsapp: {
    label: 'واتساپ',
    hover: 'hover:border-green-500/30 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400',
    icon: WhatsAppIcon,
  },
  twitter: {
    label: 'ایکس (توییتر)',
    hover: 'hover:border-foreground/20 hover:bg-foreground/5 hover:text-foreground',
    icon: XIcon,
  },
  eitaa: {
    label: 'ایتا',
    hover: 'hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400',
    icon: EitaaIcon,
  },
  linkedin: {
    label: 'لینکدین',
    hover: 'hover:border-blue-600/30 hover:bg-blue-600/10 hover:text-blue-700 dark:hover:text-blue-400',
    icon: LinkedInIcon,
  },
};

const sizeClasses = {
  sm: 'size-9 [&_svg]:size-4',
  md: 'size-10 [&_svg]:size-[18px]',
  lg: 'size-11 [&_svg]:size-5',
} as const;

export function SocialLinks({
  links,
  className,
  size = 'md',
  showLabels = false,
}: SocialLinksProps) {
  const entries = (Object.entries(links) as [SocialNetwork, string | undefined][]).filter(
    ([key, url]) => Boolean(url && networkMeta[key]),
  );

  if (entries.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label="شبکه‌های اجتماعی">
      {entries.map(([key, url]) => {
        const meta = networkMeta[key];
        return (
          <li key={key}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={meta.label}
              title={meta.label}
              className={cn(
                'inline-flex items-center justify-center rounded-xl border border-border/80 bg-background/80 text-muted-foreground transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                sizeClasses[size],
                meta.hover,
                showLabels && 'h-auto min-h-10 w-auto gap-2 px-3 py-2',
              )}
            >
              {meta.icon()}
              {showLabels && <span className="text-xs font-medium">{meta.label}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.8 4.2 2.9 11.1c-1.1.4-1.1 1.1-.2 1.4l4.8 1.5 1.8 5.6c.2.7.4.9 1 .9.6 0 .8-.3 1.1-.8l2.6-2.5 5.4 4c1 .6 1.7.3 1.9-1.1L23.5 5.5c.3-1.3-.5-1.9-1.7-1.3Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.1 1.1-1.8 1.2-.5.1-1.1.2-3.6-.8-3-1.2-5-4.1-5.1-4.3-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5.2.5.7 1.7.8 1.8.1.1.1.3 0 .5-.1.2-.1.3-.3.5-.1.1-.3.3-.4.4-.1.1-.3.3-.1.6.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.4.2.6.1.8-.1.2-.2.9-1.1 1.1-1.5.2-.4.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.5.3.6.5.1.2.1 1-.1 1.6Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.3 3h3.1l-6.8 7.8L20.7 21h-6.2l-4.8-6.3-5.5 6.3H1.1l7.3-8.4L3.3 3h6.4l4.3 5.7L16.3 3Zm-1.1 16.2h1.7L8 4.7H6.2l9 14.5Z" />
    </svg>
  );
}

function EitaaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.1 2 11.2 2 14.5 3.8 17.4 6.6 19.1L5.5 22l3.2-1.7c.8.2 1.6.3 2.3.3 5.5 0 10-4.1 10-9.2S17.5 2 12 2Zm4.8 7.3-1.6 7.6c-.1.6-.5.7-1 .4l-2.8-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-2.9 5.2-4.7c.2-.2-.1-.3-.4-.1l-6.4 4-2.8-.9c-.6-.2-.6-.6.1-.9l10.9-4.2c.5-.2 1 .1.9.7Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.5 8.7H3.4V21h3.1V8.7ZM5 3a1.8 1.8 0 1 0 0 3.6A1.8 1.8 0 0 0 5 3ZM9.2 8.7H6.2V21h3V14.5c0-2.8 3.6-3 3.6 0V21h3v-7.1c0-4.8-5.4-4.6-6.6-2.3l-.1-2.9Z" />
    </svg>
  );
}
