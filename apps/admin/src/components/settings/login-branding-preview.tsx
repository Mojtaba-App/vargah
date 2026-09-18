'use client';

import { BrandLogoMark } from '@/components/brand-logo';
import { resolveBrandingAssetSrc } from '@/lib/branding-assets';

type LoginBrandingPreviewProps = {
  siteName: string;
  siteTagline: string;
  loginLogo: string;
  loginBackground: string;
};

export function LoginBrandingPreview({
  siteName,
  siteTagline,
  loginLogo,
  loginBackground,
}: LoginBrandingPreviewProps) {
  const backgroundSrc = resolveBrandingAssetSrc(loginBackground, 'admin') ?? loginBackground;

  return (
    <div className="border-border overflow-hidden rounded-2xl border">
      <p className="border-border bg-muted/30 text-muted-foreground border-b px-4 py-2 text-xs">
        پیش‌نمایش صفحه ورود پنل
      </p>
      <div className="bg-background grid min-h-[220px] grid-cols-2">
        <div className="relative hidden overflow-hidden sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={backgroundSrc} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
          <div className="relative z-[1] flex h-full flex-col justify-end p-4">
            <div className="flex items-center gap-2">
              <BrandLogoMark size="sm" src={loginLogo} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{siteName || 'نام سایت'}</p>
                <p className="truncate text-xs text-white/75">{siteTagline || 'زیرعنوان'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 p-4">
          <BrandLogoMark size="md" src={loginLogo} className="sm:hidden" />
          <p className="text-sm font-semibold">پنل مدیریت</p>
          <div className="bg-muted h-8 w-full max-w-[140px] rounded-lg" />
          <div className="bg-muted h-8 w-full max-w-[140px] rounded-lg" />
          <div className="bg-primary/80 mt-1 h-9 w-full max-w-[140px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
