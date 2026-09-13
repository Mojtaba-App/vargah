import { defineConfig, devices } from '@playwright/test';

const webUrl = process.env.PLAYWRIGHT_WEB_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    locale: 'fa-IR',
  },
  projects: [
    {
      name: 'admin-desktop',
      testMatch: /admin-login|article-publish/,
      use: { ...devices['Desktop Chrome'], baseURL: webUrl },
    },
    {
      name: 'web-desktop',
      testMatch: /newsletter-signup|subscription/,
      use: { ...devices['Desktop Chrome'], baseURL: webUrl },
    },
    {
      name: 'web-mobile',
      testMatch: /newsletter-signup|subscription/,
      use: { ...devices['Pixel 7'], baseURL: webUrl },
    },
    {
      name: 'web-tablet',
      testMatch: /newsletter-signup|subscription/,
      use: { ...devices['iPad Mini'], baseURL: webUrl },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @vargah/web dev',
      url: `${webUrl}/admin/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
