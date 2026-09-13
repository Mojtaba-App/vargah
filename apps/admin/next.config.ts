import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import { withSecurityHeaders } from '@vargah/security/headers';

loadEnvConfig(path.resolve(__dirname, '../..'));

const adminBasePath = '/admin';

const nextConfig: NextConfig = withSecurityHeaders({
  basePath: adminBasePath,
  transpilePackages: ['@vargah/ui', '@vargah/security'],
  env: {
    NEXT_PUBLIC_ADMIN_BASE_PATH: adminBasePath,
  },
  images: {
    localPatterns: [
      { pathname: '/uploads/**' },
      { pathname: '/admin/uploads/**' },
      { pathname: '/images/**' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: adminBasePath,
        permanent: false,
        basePath: false,
      },
    ];
  },
});

export default nextConfig;
