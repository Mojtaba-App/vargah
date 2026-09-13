'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  logoutCustomer,
  type CustomerSession,
} from '@/actions/customer-auth';
import { LoginDialog } from '@/components/auth/login-dialog';

export type LoginReason = 'comment' | 'subscription' | 'profile' | null;

type CustomerAuthContextValue = {
  customer: CustomerSession | null;
  isAuthenticated: boolean;
  loginOpen: boolean;
  loginReason: LoginReason;
  openLogin: (reason?: LoginReason) => void;
  closeLogin: () => void;
  setCustomer: (session: CustomerSession | null) => void;
  logout: () => Promise<void>;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

const REASON_MESSAGES: Record<Exclude<LoginReason, null>, string> = {
  comment: 'برای ثبت نظر باید با شماره موبایل وارد حساب کاربری شوید.',
  subscription: 'برای خرید یا تمدید اشتراک، ابتدا با شماره موبایل وارد شوید.',
  profile: 'برای مشاهده پروفایل و مدیریت حساب، وارد شوید.',
};

export function getLoginReasonMessage(reason: LoginReason): string | null {
  if (!reason) return null;
  return REASON_MESSAGES[reason];
}

type CustomerAuthProviderProps = {
  children: ReactNode;
  initialCustomer: CustomerSession | null;
};

export function CustomerAuthProvider({ children, initialCustomer }: CustomerAuthProviderProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerSession | null>(initialCustomer);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<LoginReason>(null);

  const openLogin = useCallback((reason: LoginReason = null) => {
    setLoginReason(reason);
    setLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    setLoginReason(null);
  }, []);

  const handleVerified = useCallback(
    (session: CustomerSession) => {
      setCustomer(session);
      closeLogin();
      router.refresh();
    },
    [closeLogin, router],
  );

  const logout = useCallback(async () => {
    await logoutCustomer();
    setCustomer(null);
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      customer,
      isAuthenticated: Boolean(customer),
      loginOpen,
      loginReason,
      openLogin,
      closeLogin,
      setCustomer,
      logout,
    }),
    [customer, loginOpen, loginReason, openLogin, closeLogin, logout],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
      <LoginDialog
        open={loginOpen}
        reason={loginReason}
        onClose={closeLogin}
        onVerified={handleVerified}
      />
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return ctx;
}
