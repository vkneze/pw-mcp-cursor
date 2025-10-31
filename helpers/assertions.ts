import { expect, Page, Locator } from '@playwright/test';

/**
 * Purpose: Assert that the current page URL matches the expected value.
 * Inputs: page - active Playwright Page; value - substring or RegExp to match.
 * Expected: URL matches provided value; otherwise the test fails.
 */
export async function assertUrlContains(page: Page, value: string | RegExp): Promise<void> {
  if (typeof value === 'string') {
    await expect(page).toHaveURL(new RegExp(value));
    return;
  }
  await expect(page).toHaveURL(value);
}

/**
 * Purpose: Assert that the current page title matches the expected value.
 * Inputs: page - active Playwright Page; value - substring or RegExp (strings are matched case-insensitively).
 * Expected: Title matches provided value; otherwise the test fails.
 */
export async function assertTitleContains(page: Page, value: string | RegExp): Promise<void> {
  if (typeof value === 'string') {
    await expect(page).toHaveTitle(new RegExp(value, 'i'));
    return;
  }
  await expect(page).toHaveTitle(value);
}

/**
 * Purpose: Assert that a target locator is visible in the DOM.
 * Inputs: target - Playwright Locator to verify.
 * Expected: Locator is visible; otherwise the test fails.
 */
export async function assertVisible(target: Locator, options?: { page?: Page; timeoutMs?: number }): Promise<void> {
  const timeout = options?.timeoutMs ?? 30000;
  try {
    if (options?.page && options.page.isClosed()) {
      throw new Error('Page is closed before visibility assertion');
    }
    // Prefer locator-level wait first to reduce noise when page is slow
    await target.waitFor({ state: 'visible', timeout });
    // Double-check with expect for consistency with other assertions
    await expect(target).toBeVisible({ timeout: Math.max(0, timeout - 50) });
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (/Target page, context or browser has been closed/i.test(msg)) {
      throw new Error('Page or context closed while waiting for element to be visible');
    }
    throw err;
  }
}

/**
 * Purpose: Assert that a number is strictly greater than a threshold.
 * Inputs: actual - number under test; threshold - minimum expected value (exclusive).
 * Expected: actual > threshold; otherwise the test fails.
 */
export async function assertGreaterThan(actual: number, threshold: number): Promise<void> {
  expect(actual).toBeGreaterThan(threshold);
}


