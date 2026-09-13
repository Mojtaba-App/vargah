export type OsKind = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown';
export type DeviceKind = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export type ParsedUserAgent = {
  os: OsKind;
  osLabel: string;
  browserLabel: string;
  device: DeviceKind;
};

export function parseUserAgent(userAgent?: string | null): ParsedUserAgent {
  const ua = userAgent?.toLowerCase() ?? '';

  let os: OsKind = 'unknown';
  let osLabel = 'نامشخص';

  if (ua.includes('windows')) {
    os = 'windows';
    osLabel = 'ویندوز';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    os = 'ios';
    osLabel = ua.includes('ipad') ? 'iPadOS' : 'iOS';
  } else if (ua.includes('android')) {
    os = 'android';
    osLabel = 'اندروید';
  } else if (ua.includes('mac os') || ua.includes('macintosh')) {
    os = 'macos';
    osLabel = 'macOS';
  } else if (ua.includes('linux') || ua.includes('cros')) {
    os = 'linux';
    osLabel = 'لینوکس';
  }

  let browserLabel = 'مرورگر';
  if (ua.includes('edg/')) browserLabel = 'Edge';
  else if (ua.includes('firefox/')) browserLabel = 'Firefox';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browserLabel = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browserLabel = 'Safari';
  else if (ua.includes('opr/') || ua.includes('opera')) browserLabel = 'Opera';

  let device: DeviceKind = 'desktop';
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) device = 'mobile';
  else if (ua.includes('ipad') || ua.includes('tablet')) device = 'tablet';
  else if (!ua) device = 'unknown';

  return { os, osLabel, browserLabel, device };
}
