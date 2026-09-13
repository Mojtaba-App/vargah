import { test, expect } from '@playwright/test';

async function loginAdmin(page: import('@playwright/test').Page, identifier: string, password: string) {
  await page.getByLabel('ایمیل یا نام کاربری').fill(identifier);
  await page.getByLabel('رمز عبور').fill(password);
  await page.getByRole('button', { name: 'ادامه' }).click();

  const devCode = page.locator('.font-mono.text-2xl');
  await expect(devCode).toBeVisible({ timeout: 10_000 });
  const code = (await devCode.textContent())?.trim() ?? '';
  await page.getByLabel('کد پیامکی (۶ رقم)').fill(code);
  await page.getByRole('button', { name: 'تأیید و ورود' }).click();
}

test.describe('ورود پنل مدیریت', () => {
  test('نویسنده می‌تواند وارد پنل شود', async ({ page }) => {
    await page.goto('/admin/login');

    await expect(page.getByRole('heading', { name: 'پنل مدیریت' })).toBeVisible();

    await loginAdmin(page, 'writer@magazine.ir', 'writer1234');

    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByText('داشبورد')).toBeVisible();
  });

  test('ورود با رمز نادرست خطا نشان می‌دهد', async ({ page }) => {
    await page.goto('/admin/login');

    await page.getByLabel('ایمیل یا نام کاربری').fill('writer@magazine.ir');
    await page.getByLabel('رمز عبور').fill('wrong-password');
    await page.getByRole('button', { name: 'ادامه' }).click();

    await expect(page.getByRole('alert')).toContainText('نادرست');
  });
});
