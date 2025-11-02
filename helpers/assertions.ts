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
 * Inputs: target - Playwright Locator to verify; options - optional timeout.
 * Expected: Locator is visible; otherwise the test fails.
 */
export async function assertVisible(target: Locator, options?: { timeout?: number }): Promise<void> {
  await expect(target).toBeVisible(options);
}



