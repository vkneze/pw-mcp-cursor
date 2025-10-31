import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

/**
 * ✅ Parallel execution control:
 *
 * - `fullyParallel: true` → Tests inside the same file and across different files
 *   can run at the same time. Each browser project (Chromium, Firefox, WebKit)
 *   can also run concurrently depending on the `workers` setting and CPU capacity.
 *   ⚠️ Requires careful test isolation to avoid conflicts (e.g., shared data, users, or state).
 *
 * - `fullyParallel: false` → Tests within the same file run sequentially,
 *   but different test files (and browser projects) can still run in parallel
 *   across available workers. This is safer and more stable for most projects.
 */
  fullyParallel: false,

  // Prevent committing focused tests
  forbidOnly: !!process.env.CI,

  /**
   * Retries for transient failures:
   * - CI: 2 retries for stability on shared runners
   * - Local: 1 retry to handle timeouts caused by parallel execution
   */
  retries: process.env.CI ? 2 : 1,

  /**
   * Workers per browser project:
   * - Local: 2-3 is a good balance between speed and stability
   * - CI: 2 recommended on shared runners
   */
  workers: Number(process.env.PW_WORKERS ?? (process.env.CI ? '2' : '2')),

  // Keep output artifacts to avoid ENOENT when external reporters read them later
  preserveOutput: 'always',

  // Global timeouts
  timeout: 90 * 1000,          // max time per test
  expect: { timeout: 30000 },  // max time for expect assertions

  // 🧾 Reporters
  reporter: [
    ['list'],
    ['allure-playwright'],
  ],

  // Browser context options
  use: {
    baseURL: 'https://automationexercise.com',
    headless: false,               // headless ensures more stable parallel execution
    viewport: { width: 1280, height: 720 },
    actionTimeout: 20000,         // max time per action (click, fill, etc.)
    navigationTimeout: 60000,     // max time for page.goto() / navigation
    screenshot: 'only-on-failure',
    // Prefer zip traces and keep raw artifacts available for reporters like Allure
    trace: { mode: 'on-first-retry', attachments: true },
    video: 'retain-on-failure',
  },

  // Browser projects
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'Firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'WebKit',
    //   use: { ...devices['Desktop Safari'] },
    // }
  ],

  // Directory for test artifacts
  outputDir: 'test-results/',
});
