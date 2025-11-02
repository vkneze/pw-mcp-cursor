import type { Page } from '@playwright/test';
import { COMMON } from '../constants/selectors';

/**
 * Dismiss any visible modal by clicking dismiss button or pressing Escape.
 * Gracefully handles cases where modal doesn't exist or is already hidden.
 */
export async function dismissAnyModalIfVisible(page: Page): Promise<void> {
  // Try to click dismiss button (if exists)
  const dismissButton = page
    .locator(COMMON.ANY_VISIBLE_MODAL)
    .getByRole('button', { name: /continue shopping|close/i })
    .first();
  
  // Try to click the dismiss button within 2 seconds.
  // If it works, mark it as clicked = true
  // If it fails for any reason, mark it as clicked = false;
  // and don’t crash the test.
  const clicked = await dismissButton.click({ timeout: 2000 }).then(() => true).catch(() => false);
  
  if (!clicked) {
    // Fallback: press Escape key
    await page.keyboard.press('Escape').catch((err) => {
      console.warn('[WARN] Failed to press Escape to dismiss modal:', err.message);
    });
  }

  // Wait for modal to hide
  await page.locator(COMMON.ANY_VISIBLE_MODAL).waitFor({ state: 'hidden', timeout: 3000 }).catch((err) => {
    console.warn('[WARN] Modal did not hide within timeout (may already be hidden):', err.message);
  });
}


