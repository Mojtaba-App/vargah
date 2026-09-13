'use client';

import { cn } from '@/lib/utils';
import { useCustomerAuth } from '@/components/auth/customer-auth-provider';
import { CustomerAuthMenu } from '@/components/auth/customer-auth-menu';
import { headerActionButtonClass } from '@/components/layout/header-action-button';

type CustomerAuthButtonProps = {
  className?: string;
};

export function CustomerAuthButton({ className }: CustomerAuthButtonProps) {
  const { isAuthenticated, openLogin } = useCustomerAuth();

  if (isAuthenticated) {
    return <CustomerAuthMenu className={className} />;
  }

  return (
    <button
      type="button"
      onClick={() => openLogin()}
      className={cn(headerActionButtonClass, className)}
      aria-label="ورود به حساب کاربری"
      title="ورود به حساب"
    >
      <LoginIcon />
    </button>
  );
}

function LoginIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
