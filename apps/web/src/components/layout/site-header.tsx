'use client';

import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { Button } from '@vargah/ui/components/button';
import { Container } from '@vargah/ui/components/container';
import { cn } from '@/lib/utils';
import { HeaderLogo } from '@/components/layout/header-logo';
import { HeaderSearch } from '@/components/layout/header-search';
import { HeaderCartButton } from '@/components/layout/header-cart-button';
import { MobileNav } from '@/components/layout/mobile-nav';
import { ServicesMenu } from '@/components/layout/services-menu';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { CustomerAuthButton } from '@/components/auth/customer-auth-button';
import type { ServiceNavItem } from '@vargah/business/services-content-types';

export type NavLink = { href: string; label: string };

export type SiteHeaderLabels = {
  homeAria: string;
  tagline: string;
  services: string;
  search: string;
  searchPlaceholder: string;
  cart: string;
  subscribe: string;
};

type SiteHeaderProps = {
  primaryLinks: NavLink[];
  serviceNavItems: ServiceNavItem[];
  labels: SiteHeaderLabels;
  branding: {
    siteName: string;
    tagline: string;
    logoSrc: string;
  };
};

function NavItem({ href, label }: NavLink) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
      )}
    >
      {label}
      {isActive && (
        <span
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

export function SiteHeader({
  primaryLinks,
  serviceNavItems,
  labels,
  branding,
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const serviceLinks = serviceNavItems.map((item) => ({ href: item.href, label: item.label }));
  const allLinks = [...primaryLinks, ...serviceLinks];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-[var(--site-header-height)] transition-[background-color,border-color,box-shadow] duration-300',
        scrolled
          ? 'border-b border-border/80 bg-background/95 shadow-sm backdrop-blur-xl'
          : 'border-b border-transparent bg-background/45 backdrop-blur-md',
      )}
    >
      <Container className="h-full">
        <div className="flex h-full items-center justify-between gap-3">
          <HeaderLogo
            siteName={branding.siteName}
            tagline={branding.tagline}
            logoSrc={branding.logoSrc}
            homeAria={labels.homeAria}
            compact={scrolled}
          />

          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label="ناوبری اصلی"
          >
            {primaryLinks.map((link) => (
              <NavItem key={link.href} {...link} />
            ))}
            <ServicesMenu label={labels.services} items={serviceNavItems} />
          </nav>

          <div className="relative z-10 flex shrink-0 items-center gap-1 sm:gap-1.5">
            <HeaderSearch
              placeholder={labels.searchPlaceholder}
              label={labels.search}
              className="hidden md:block"
            />
            <HeaderCartButton label={labels.cart} className="relative z-10" />
            <ThemeToggle className="relative z-10" />
            <CustomerAuthButton className="relative z-10" />
            <Link href="/subscription" className="hidden sm:block">
              <Button
                size="sm"
                className="h-9 rounded-full px-4 text-xs font-semibold shadow-sm sm:text-sm"
              >
                {labels.subscribe}
              </Button>
            </Link>
            <MobileNav
              links={allLinks}
              serviceNavItems={serviceNavItems}
              labels={labels}
              branding={branding}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}

