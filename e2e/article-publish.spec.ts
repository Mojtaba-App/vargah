import { test, expect } from '@playwright/test';

test.describe('انتشار مقاله', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('ایمیل یا نام کاربری').fill('writer@magazine.ir');
    await page.getByLabel('رمز عبور').fill('writer1234');
    await page.getByRole('button', { name: 'ادامه' }).click();
    const devCode = page.locator('.font-mono.text-2xl');
    await expect(devCode).toBeVisible({ timeout: 10_000 });
    const code = (await devCode.textContent())?.trim() ?? '';
    await page.getByLabel('کد پیامکی (۶ رقم)').fill(code);
    await page.getByRole('button', { name: 'تأیید و ورود' }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test('ایجاد پیش‌نویس و انتشار مقاله', async ({ page }) => {
    const title = `مقاله تست E2E ${Date.now()}`;

    await page.goto('/admin/content/articles/new');
    await page.getByLabel('عنوان').fill(title);
    await page.getByLabel('خلاصه').fill('خلاصه تست خودکار');
    await page.getByRole('button', { name: 'ذخیره مقاله' }).click();

    await expect(page).toHaveURL(/\/admin\/content\/articles\/.+/);

    await page.getByLabel('وضعیت').selectOption('PUBLISHED');
    await page.getByRole('button', { name: 'ذخیره تغییرات' }).click();

    await expect(page.getByText('منتشرشده')).toBeVisible();
  });
});
