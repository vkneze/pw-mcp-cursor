import type { Page } from '@playwright/test';
import { COMMON } from '../constants/selectors';

/**
 * Dismiss any visible modal (cart modal, generic modals) by clicking dismiss button or pressing Escape.
 * Waits for modal to be hidden after dismissal.
 * Gracefully handles cases where modal doesn't exist or is already hidden.
 */
export async function dismissAnyModalIfVisible(page: Page): Promise<void> {
  const anyVisibleModal = page.locator(COMMON.ANY_VISIBLE_MODAL);
  const cartModal = page.locator(COMMON.CART_MODAL);
  
  // Check if any modal is visible
  const isCartModalVisible = await cartModal.isVisible().catch(() => false);
  const isAnyModalVisible = await anyVisibleModal.isVisible().catch(() => false);
  
  if (!isCartModalVisible && !isAnyModalVisible) {
    return; // No modal to dismiss
  }

  // Try to find and click dismiss button
  const dismissButton = page
    .locator('#cartModal, .modal:visible')
    .getByRole('button', { name: /continue shopping|close/i })
    .first();
  
  const dismissButtonCount = await dismissButton.count().catch(() => 0);
  
  if (dismissButtonCount > 0) {
    await dismissButton.click().catch(() => false);
  } else {
    // Fallback: press Escape if no dismiss button found
    await page.keyboard.press('Escape').catch(() => false);
  }

  // Wait for modals to be hidden (fire and forget - don't block if they don't hide)
  await cartModal.waitFor({ state: 'hidden', timeout: 7000 }).catch(() => {});
  await anyVisibleModal.waitFor({ state: 'hidden', timeout: 7000 }).catch(() => {});
}


