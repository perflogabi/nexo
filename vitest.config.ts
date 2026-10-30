import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // RTL sob carga (suite completa) pode ultrapassar 5s default e falhar por timeout flaky.
    testTimeout: 15_000,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      '.next',
      'e2e',
      'tests/e2e',
      'tests/integration/**',
      '**/*.stories.*',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
