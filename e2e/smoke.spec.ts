import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('login page responds', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  });
});
