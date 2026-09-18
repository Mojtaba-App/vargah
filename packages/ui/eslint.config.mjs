import baseConfig from '@vargah/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**'],
  },
];
