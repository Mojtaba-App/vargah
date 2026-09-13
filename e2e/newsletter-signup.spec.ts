import { test, expect } from '@playwright/test';

test.describe('ثبت‌نام / عضویت خبرنامه', () => {
  test('کاربر می‌تواند در خبرنامه ثبت‌نام کند', async ({ page }) => {
    await page.goto('/fa');

    const email = `e2e-${Date.now()}@example.com`;
    await page.getByLabel(/ایمیل/).fill(email);
    await page.getByRole('button', { name: 'عضویت' }).click();

    await expect(page.getByRole('status')).toContainText('با موفقیت ثبت شد');
  });
});
