// Playwright config template for qa-flow-tester skill.
// Copy to project root, then customize baseURL + projects as needed.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright/specs',
  outputDir: './tests/playwright/reports',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://www.revfactor.io',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-iphone-14',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
