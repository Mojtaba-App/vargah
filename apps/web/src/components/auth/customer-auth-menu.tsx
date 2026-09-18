'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { useCustomerAuth } from '@/components/auth/customer-auth-provider';
import { CustomerAvatar } from '@/components/shared/customer-avatar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { headerActionButtonClass } from '@/components/layout/header-action-button';
import { useSubscriptionCart } from '@/components/subscription/subscription-cart-provider';
import { maskPhone } from '@/lib/customer-auth/phone';
import { cn } from '@/lib/utils';

type CustomerAuthMenuProps = {
  className?: string;
};

export function CustomerAuthMenu({ className }: CustomerAuthMenuProps) {
  const { customer, logout } = useCustomerAuth();
  const { itemCount, setDrawerOpen } = useSubscriptionCart();
  const [open, setOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!customer) return null;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(headerActionButtonClass, 'p-0 hover:scale-100')}
        aria-label="منوی حساب کاربری"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <CustomerAvatar name={customer.name} avatar={customer.avatar} size="sm" ring={false} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="منوی کاربر"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            className="border-border bg-background absolute end-0 top-[calc(100%+0.5rem)] z-[70] w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-xl"
          >
            <div className="border-border from-primary/8 border-b bg-gradient-to-br to-transparent px-4 py-4">
              <div className="flex items-center gap-3">
                <CustomerAvatar name={customer.name} avatar={customer.avatar} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{customer.name}</p>
                  <p className="text-muted-foreground truncate text-xs" dir="ltr">
                    {maskPhone(customer.phone)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              <MenuLink href="/profile" onClick={() => setOpen(false)} icon={<ProfileIcon />}>
                پروفایل کاربری
              </MenuLink>
              <MenuLink
                href="/subscription"
                onClick={() => setOpen(false)}
                icon={<SubscriptionIcon />}
                badge={itemCount > 0 ? itemCount : undefined}
              >
                خرید اشتراک
              </MenuLink>
              <MenuLink
                href="/profile?tab=payments"
                onClick={() => setOpen(false)}
                icon={<PurchasesIcon />}
              >
                سوابق خرید
              </MenuLink>
              {itemCount > 0 && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setDrawerOpen(true);
                  }}
                  className="hover:bg-muted flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                >
                  <CartMenuIcon />
                  <span className="flex-1 text-start">سبد اشتراک</span>
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[11px] font-bold">
                    {itemCount}
                  </span>
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setLogoutConfirmOpen(true);
                }}
                className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              >
                <LogoutIcon />
                خروج از حساب
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="خروج از حساب"
        description="آیا مطمئن هستید که می‌خواهید از حساب کاربری خارج شوید؟"
        confirmLabel="بله، خروج"
        cancelLabel="انصراف"
        variant="destructive"
        loading={loggingOut}
        onConfirm={async () => {
          setLoggingOut(true);
          try {
            await logout();
            setLogoutConfirmOpen(false);
          } finally {
            setLoggingOut(false);
          }
        }}
        onCancel={() => {
          if (!loggingOut) setLogoutConfirmOpen(false);
        }}
      />
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  icon,
  badge,
  children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
    >
      {icon}
      <span className="flex-1">{children}</span>
      {badge != null && badge > 0 && (
        <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[11px] font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-muted-foreground"
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SubscriptionIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-muted-foreground"
    >
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function PurchasesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-muted-foreground"
    >
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M14 2v6h6M9 15h6M9 11h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartMenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-muted-foreground"
    >
      <path
        d="M6 6h15l-1.5 9h-12z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M14 12H4m0 0 3-3M4 12l3 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
