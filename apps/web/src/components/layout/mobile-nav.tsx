'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, usePathname } from '@/i18n/navigation';
import { Button } from '@vargah/ui/components/button';
import { cn } from '@/lib/utils';
import { headerActionButtonClass } from '@/components/layout/header-action-button';
import { HeaderLogo } from '@/components/layout/header-logo';
import { HeaderSearch } from '@/components/layout/header-search';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import type { ServiceNavItem } from '@vargah/business/services-content-types';
import { ServiceIconWell } from '@/components/layout/services-menu';
import type { NavLink, SiteHeaderLabels } from '@/components/layout/site-header';
import { useCustomerAuth } from '@/components/auth/customer-auth-provider';

type MobileNavProps = {
  links: NavLink[];
  serviceNavItems: ServiceNavItem[];
  labels: SiteHeaderLabels;
  branding: {
    siteName: string;
    tagline: string;
    logoSrc: string;
  };
};

export function MobileNav({ links, serviceNavItems, labels, branding }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated, openLogin } = useCustomerAuth();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const primaryLinks = links.filter((link) => !serviceNavItems.some((s) => s.href === link.href));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(headerActionButtonClass, 'lg:hidden')}
        aria-label="باز کردن منو"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
      >
        <MenuIcon />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.button
              type="button"
              aria-label="بستن منو"
              className="bg-foreground/25 absolute inset-0 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              id="mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              aria-label="منوی موبایل"
              className="border-border bg-background absolute end-0 top-0 flex h-full w-[min(100%,21rem)] flex-col border-s shadow-2xl"
              initial={prefersReducedMotion ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={prefersReducedMotion ? undefined : { x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="border-border flex items-center justify-between border-b px-4 py-3">
                <HeaderLogo
                  siteName={branding.siteName}
                  tagline={labels.tagline}
                  logoSrc={branding.logoSrc}
                  homeAria={labels.homeAria}
                />
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 items-center justify-center rounded-full"
                    aria-label="بستن منو"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className="border-border border-b px-4 py-3">
                <HeaderSearch
                  variant="full"
                  placeholder={labels.searchPlaceholder}
                  label={labels.search}
                />
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                <p className="text-muted-foreground mb-2 px-2 text-[11px] font-semibold tracking-wider uppercase">
                  ماهنامه
                </p>
                <ul className="space-y-0.5">
                  {primaryLinks.map((link) => (
                    <MobileNavItem
                      key={link.href}
                      link={link}
                      pathname={pathname}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </ul>

                <p className="text-muted-foreground mt-5 mb-2 px-2 text-[11px] font-semibold tracking-wider uppercase">
                  {labels.services}
                </p>
                <ul className="space-y-2">
                  {serviceNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'border-border/70 hover:bg-muted flex gap-3 rounded-xl border p-3 transition-colors',
                            isActive && 'border-primary/30 bg-primary/5',
                          )}
                        >
                          <ServiceIconWell icon={item.icon} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="border-border space-y-2 border-t p-4">
                {isAuthenticated ? (
                  <Link href="/profile" onClick={() => setOpen(false)} className="block">
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl text-sm font-semibold"
                    >
                      پروفایل کاربری
                    </Button>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full rounded-xl text-sm font-semibold"
                    onClick={() => {
                      openLogin();
                      setOpen(false);
                    }}
                  >
                    ورود / ثبت‌نام
                  </Button>
                )}
                <Link href="/subscription" onClick={() => setOpen(false)} className="block">
                  <Button className="h-11 w-full rounded-xl text-sm font-semibold">
                    {labels.subscribe}
                  </Button>
                </Link>
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileNavItem({
  link,
  pathname,
  onNavigate,
}: {
  link: NavLink;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

  return (
    <li>
      <Link
        href={link.href}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors',
          isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
        )}
      >
        {link.label}
        {isActive && <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />}
      </Link>
    </li>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="7" y2="7" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="17" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
