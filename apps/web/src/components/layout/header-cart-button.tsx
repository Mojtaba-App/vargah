'use client';

import { headerActionButtonClass } from '@/components/layout/header-action-button';
import { useSubscriptionCart } from '@/components/subscription/subscription-cart-provider';
import { cn } from '@/lib/utils';

type HeaderCartButtonProps = {
  label: string;
  className?: string;
};

export function HeaderCartButton({ label, className }: HeaderCartButtonProps) {
  const { itemCount, pulse, setDrawerOpen, ready } = useSubscriptionCart();

  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className={cn(
        headerActionButtonClass,
        'relative',
        pulse && 'animate-pulse text-primary',
        itemCount > 0 && 'text-primary',
        className,
      )}
      aria-label={itemCount > 0 ? `${label} — ${itemCount} مورد` : label}
      title={label}
    >
      <CartIcon />
      {ready && itemCount > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-sm">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}
