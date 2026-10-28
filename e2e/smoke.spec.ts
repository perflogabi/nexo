import { test, expect } from '@playwright/test';

/**
 * Smoke mínimo do bootstrap — não cobre jornadas do PRD ainda.
 * Requer app em execução (dev/start) ou webServer no CI quando configurado.
 */
test.describe('bootstrap smoke', () => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL && !process.env.CI,
    'App server not configured for local e2e yet',
  );

  test('home responds', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
