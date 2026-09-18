import { LoginBrandPanel } from '@/components/auth/login-brand-panel';
import { LoginForm } from '@/components/auth/login-form';
import { getSiteConfig } from '@/lib/site-config';

export default async function LoginPage() {
  const { branding } = await getSiteConfig();

  return (
    <div className="bg-background grid min-h-screen w-full max-w-[100vw] overflow-x-hidden lg:grid-cols-2">
      <LoginBrandPanel
        siteName={branding.siteName}
        siteTagline={branding.siteTagline}
        loginLogo={branding.loginLogo}
        loginBackground={branding.loginBackground}
        adminLogo={branding.adminLogo}
      />

      <main className="relative flex min-h-0 min-w-0 items-center justify-center overflow-x-hidden px-4 py-10 sm:px-8 lg:col-start-2 lg:px-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,var(--accent),transparent_40%)]"
          aria-hidden="true"
        />
        <div className="relative z-[1] w-full max-w-md min-w-0">
          <LoginForm
            siteName={branding.siteName}
            siteTagline={branding.siteTagline}
            loginLogo={branding.loginLogo}
            adminLogo={branding.adminLogo}
          />
        </div>
      </main>
    </div>
  );
}
