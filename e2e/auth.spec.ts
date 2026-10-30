import { test, expect } from '@playwright/test';
import { loginApiContext, loginViaUi } from './helpers/auth';

test.describe('E1 E7 auth', () => {
  test('E1 login employee → /chat', async ({ page }) => {
    await loginViaUi(page, 'elisa.prado@nexo.com.br');
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByPlaceholder(/escreva/i)).toBeVisible();
  });

  test('E7 employee blocked from analyst API', async () => {
    const ctx = await loginApiContext('diego.ramos@nexo.com.br');
    try {
      // Middleware redireciona EMPLOYEE /api/analyst → /chat (307); não segue redirect.
      const res = await ctx.get('/api/analyst/conversations', { maxRedirects: 0 });
      expect([307, 403]).toContain(res.status());
      if (res.status() === 307) {
        expect(res.headers()['location'] ?? '').toMatch(/\/chat/);
      }
    } finally {
      await ctx.dispose();
    }
  });

  test('E7 analyst reaches /analyst', async ({ page }) => {
    await loginViaUi(page, 'analista@nexo.local');
    await page.goto('/analyst');
    await expect(page).toHaveURL(/\/analyst/);
  });
});
