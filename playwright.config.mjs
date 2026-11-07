import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-results',
  reporter: 'list',
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  use: {
    headless: true,
    viewport: { width: 1180, height: 980 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
