import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Suite de integração — só com E2E_DATABASE_OK + nexo_e2e (via run-integration.mjs).
 */
export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30_000,
    include: ['tests/integration/**/*.{test,spec}.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
