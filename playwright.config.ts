import { defineConfig, devices } from '@playwright/test';

/**
 * E2E preparado no bootstrap. Fluxos do PRD serão adicionados nas fases de UI.
 * Não exige Gemini real — usar agent scripted (E2E=1) quando implementado.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.CI
    ? {
        command: 'npm run start',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: false,
      }
    : undefined,
});
