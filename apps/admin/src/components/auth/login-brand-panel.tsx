import { resolveBrandingAssetSrc } from '@/lib/branding-assets';
import { BrandLogoMark } from '@/components/brand-logo';

const FEATURES = [
  { title: 'مدیریت محتوا', description: 'مقالات، شماره‌ها و رسانه در یک پنل واحد' },
  { title: 'دسترسی امن', description: 'ورود دو مرحله‌ای و کنترل نقش کاربران' },
  { title: 'گزارش و تحلیل', description: 'نمای کلی از عملکرد و مخاطبان' },
] as const;

type LoginBrandPanelProps = {
  siteName: string;
  siteTagline: string;
  loginLogo: string;
  loginBackground: string;
  adminLogo?: string;
};

export function LoginBrandPanel({
  siteName,
  siteTagline,
  loginLogo,
  loginBackground,
  adminLogo,
}: LoginBrandPanelProps) {
  const backgroundSrc = resolveBrandingAssetSrc(loginBackground, 'admin') ?? loginBackground;

  return (
    <aside className="relative hidden min-h-0 min-w-0 overflow-hidden lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:justify-between">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backgroundSrc}
        alt=""
        className="absolute inset-0 size-full object-cover object-center"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/25"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-l from-black/35 via-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center px-8 py-12 xl:px-12">
        <div className="mb-10 flex items-center gap-3">
          <BrandLogoMark size="lg" src={loginLogo} fallbackSrc={adminLogo} className="shadow-lg" />
          <div className="min-w-0">
            <p className="text-lg font-bold text-white">{siteName}</p>
            <p className="text-sm text-white/75">{siteTagline}</p>
          </div>
        </div>

        <h2 className="max-w-md text-balance text-3xl font-bold leading-tight text-white xl:text-4xl">
          مدیریت حرفه‌ای محتوای ماهنامه
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/85">
          انتشار، ویرایش و پایش مطالب با ابزارهای امن و سازگار با تیم تحریریه فارسی‌زبان.
        </p>

        <ul className="mt-10 space-y-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="flex gap-3 rounded-2xl border border-white/15 bg-black/25 px-4 py-3 backdrop-blur-md"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs text-white">
                ✓
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{feature.title}</p>
                <p className="mt-0.5 text-sm text-white/75">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-[1] px-8 py-5 text-xs text-white/55 xl:px-12">
        © {new Date().getFullYear()} {siteName} — دسترسی محدود به پرسنل مجاز
      </p>
    </aside>
  );
}
