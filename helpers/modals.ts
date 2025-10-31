import type { Page } from '@playwright/test';
import { COMMON } from '../helpers/selectors';

export async function dismissAnyModalIfVisible(page: Page): Promise<void> {
  const anyVisibleModal = page.locator(COMMON.ANY_VISIBLE_MODAL);
  const cartModal = page.locator(COMMON.CART_MODAL);
  const dismissButton = page
    .locator('#cartModal, .modal:visible')
    .getByRole('button', { name: /continue shopping|close/i })
    .first();

  const visible =
    (await anyVisibleModal.isVisible().catch(() => false)) ||
    (await cartModal.isVisible().catch(() => false));
  if (!visible) return;

  try {
    if (await dismissButton.count()) {
      await dismissButton.click().catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
  } catch {}

  await cartModal.waitFor({ state: 'hidden', timeout: 7000 }).catch(() => {});
  await anyVisibleModal.waitFor({ state: 'hidden', timeout: 7000 }).catch(() => {});
}


