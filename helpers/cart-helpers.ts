import type { Locator, Page } from '@playwright/test';
import { dismissAnyModalIfVisible } from './modals';

/**
 * Click the first available locator from a list of candidates.
 * Tries each candidate until one successfully clicks.
 * Returns the locator that was clicked, or null if none were clickable within the timeout.
 */
async function clickFirstAvailable(
  candidates: Locator[],
  options?: { force?: boolean; timeoutMs?: number }
): Promise<Locator | null> {
  const force = options?.force ?? true;
  const deadline = Date.now() + (options?.timeoutMs ?? 3000);
  
  while (Date.now() < deadline) {
    for (const cand of candidates) {
      const count = await cand.count().catch(() => 0);
      if (count > 0) {
        const clicked = await cand.first().click({ force }).then(() => true).catch(() => false);
        if (clicked) return cand;
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

/**
 * Add first N products to cart from a list of product cards.
 * Handles hover, click, and modal dismissal for each product.
 * Returns array of product names that were added (or attempted).
 */
export async function addFirstNFromCards(
  page: Page,
  cards: Locator,
  nameSelector: string,
  addSelectors: string[],
  take: number,
): Promise<string[]> {
  const names: string[] = [];
  const total = await cards.count();
  
  for (let i = 0; i < total && names.length < take; i++) {
    const card = cards.nth(i);
    
    // Scroll card into view
    await card.scrollIntoViewIfNeeded().catch(() => {});
    
    // Hover to reveal add-to-cart overlay (brand pages need more time)
    const hovered = await card.hover({ force: true }).then(() => true).catch(() => false);
    if (hovered) {
      await page.waitForTimeout(500); // Allow overlay animation to complete
    }
    
    // Extract product name
    const name = (await card.locator(nameSelector).textContent().catch(() => null) || '').trim();

    // Build list of add-to-cart button candidates
    const candidates = [
      ...addSelectors.map(sel => card.locator(sel).first()),
      card.getByRole('link', { name: /add to cart/i }).first(),
      card.getByRole('button', { name: /add to cart/i }).first(),
    ];

    const clicked = await clickFirstAvailable(candidates, { force: true, timeoutMs: 3000 });
    if (!clicked) {
      console.log(`[WARN] Could not click add-to-cart for product: ${name || `card #${i + 1}`}`);
      continue;
    }

    // Wait for modal confirmation and dismiss it
    const modalAppeared = await Promise.race([
      page.locator('#cartModal').waitFor({ state: 'visible', timeout: 3000 }),
      page.locator('.modal:visible').waitFor({ state: 'visible', timeout: 3000 }),
    ]).then(() => true).catch(() => false);
    
    if (modalAppeared) {
      await dismissAnyModalIfVisible(page);
    }
    
    // Add product name to list (modal appearance is unreliable, so we add if click succeeded)
    if (name) {
      names.push(name);
    }
    
    // Wait for any pending navigation/DOM updates
    await page.waitForLoadState('domcontentloaded').catch(() => {});
  }
  
  return names;
}


