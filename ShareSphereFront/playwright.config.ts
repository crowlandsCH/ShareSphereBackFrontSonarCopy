import { defineConfig, devices } from '@playwright/test';

// `process` is provided by Node at runtime; declare to satisfy TypeScript in this workspace
declare const process: any;

export default defineConfig({
  // Run tests sequentially (single worker) to avoid shared-state conflicts
  workers: 1,
  globalSetup: './tests/e2e/global-setup.ts',
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    storageState: 'tests/.auth/state.json',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
