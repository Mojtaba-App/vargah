import { test, expect } from '@playwright/test';

test.describe('صفحه اشتراک', () => {
  test('پنل مشترک و زرین‌پال نمایش داده می‌شوند', async ({ page }) => {
    await page.goto('/fa/subscription');

    await expect(page.getByRole('heading', { name: 'اشتراک' })).toBeVisible();
    await expect(page.getByText('پلن‌های اشتراک')).toBeVisible();
    await expect(page.getByText('دیجیتال')).toBeVisible();
    await expect(page.getByText('زرین‌پال')).toBeVisible();
    await expect(page.getByText('پنل مشترک')).toBeVisible();
  });
});
