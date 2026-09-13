import nextConfig from '@vargah/eslint-config/next';

export default [
  ...nextConfig,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
