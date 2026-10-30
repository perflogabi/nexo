import { defineConfig, devices } from '@playwright/test';

/**
 * E2E — Chromium, 1 worker (paralelismo conservador).
 * Requer banco nexo_e2e validado (scripts/run-e2e.mjs) e AGENT_LLM=mock.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // next.config output: 'standalone' — `next start` avisa; usar o server gerado.
    command: 'node .next/standalone/server.js',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      NEXO_ENV: process.env.NEXO_ENV || 'e2e',
      AGENT_LLM: 'mock',
      E2E_DATABASE_OK: process.env.E2E_DATABASE_OK || '1',
      PORT: '3000',
      HOSTNAME: '127.0.0.1',
    },
  },
});
