import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSecurityHeaders } from '@vargah/security/headers';

loadEnvConfig(path.resolve(__dirname, '../..'));

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, '');
const adminInternalUrl = process.env.ADMIN_INTERNAL_URL ?? 'http://127.0.0.1:3001';

function parseRemotePatterns() {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];

  if (cdnUrl) {
    try {
      const { hostname, protocol } = new URL(cdnUrl);
      patterns.push({ protocol: protocol.replace(':', '') as 'http' | 'https', hostname });
    } catch {
      // invalid CDN URL
    }
  }

  const s3Endpoint = process.env.S3_ENDPOINT;
  if (s3Endpoint) {
    try {
      const { hostname, protocol } = new URL(s3Endpoint);
      patterns.push({ protocol: protocol.replace(':', '') as 'http' | 'https', hostname });
    } catch {
      // invalid S3 endpoint
    }
  }

  return patterns;
}

const nextConfig: NextConfig = withSecurityHeaders({
  transpilePackages: ['@vargah/ui', 'framer-motion', '@vargah/security', '@vargah/seo'],
  assetPrefix: cdnUrl || undefined,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    localPatterns: [{ pathname: '/images/**' }, { pathname: '/uploads/**' }],
    remotePatterns: parseRemotePatterns(),
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/admin/login',
        permanent: false,
      },
      {
        source: '/fa/login',
        destination: '/admin/login',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const adminOrigin = adminInternalUrl.replace(/\/$/, '');
    return [
      {
        source: '/admin',
        destination: `${adminOrigin}/admin`,
      },
      {
        source: '/admin/:path*',
        destination: `${adminOrigin}/admin/:path*`,
      },
    ];
  },
});

export default withNextIntl(nextConfig);
