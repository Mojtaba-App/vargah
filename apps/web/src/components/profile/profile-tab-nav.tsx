'use client';

import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

export type ProfileTabId = 'overview' | 'account' | 'address' | 'payments' | 'tickets';

type TabConfig = {
  id: ProfileTabId;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export const PROFILE_TABS: TabConfig[] = [
  { id: 'overview', label: 'خلاصه', description: 'نمای کلی حساب', icon: OverviewIcon },
  { id: 'account', label: 'حساب', description: 'اطلاعات و تصویر', icon: AccountIcon },
  { id: 'address', label: 'آدرس', description: 'آدرس پستی', icon: AddressIcon },
  { id: 'payments', label: 'خریدها', description: 'اشتراک و پرداخت', icon: PaymentsIcon },
  { id: 'tickets', label: 'پشتیبانی', description: 'تیکت‌ها', icon: SupportIcon },
];

type ProfileTabNavProps = {
  active: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
  counts?: Partial<Record<ProfileTabId, number>>;
};

export function ProfileTabNav({ active, onChange, counts }: ProfileTabNavProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="بخش‌های پروفایل">
      {PROFILE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        const count = counts?.[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group flex min-w-[9.5rem] shrink-0 items-center gap-3 rounded-2xl border px-3.5 py-3 text-start transition-all duration-200 lg:min-w-0 lg:w-full',
              isActive
                ? 'border-primary/30 bg-primary text-primary-foreground shadow-md shadow-primary/15'
                : 'border-border/70 bg-background/80 text-foreground hover:border-primary/25 hover:bg-muted/70 dark:bg-card/70 dark:hover:bg-muted/50',
            )}
          >
            <span
              className={cn(
                'inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                isActive ? 'bg-primary-foreground/15' : 'bg-muted group-hover:bg-primary/10',
              )}
            >
              <Icon className={cn('size-[18px]', isActive ? 'text-primary-foreground' : 'text-primary')} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="block text-sm font-semibold tracking-tight">{tab.label}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                      isActive ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary',
                    )}
                  >
                    {count}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'mt-0.5 block truncate text-[11px]',
                  isActive
                    ? 'text-primary-foreground/85'
                    : 'text-foreground/65 dark:text-foreground/70',
                )}
              >
                {tab.description}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function AddressIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function PaymentsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function SupportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M4 12v5a1 1 0 0 0 1 1h1v-6H5a1 1 0 0 0-1 1Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M20 12a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M20 12v5a1 1 0 0 1-1 1h-1v-6h1a1 1 0 0 1 1 1Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}
