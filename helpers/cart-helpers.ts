import type { Locator, Page } from '@playwright/test';
import { dismissAnyModalIfVisible } from './modals';
import { clickFirstAvailable } from './interactions';

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
    await card.scrollIntoViewIfNeeded().catch(() => {});
    
    // Hover and wait for overlay to appear (brand pages need more time)
    await card.hover({ force: true }).catch(() => {});
    await page.waitForTimeout(500); // Give overlay time to appear
    
    const name = ((await card.locator(nameSelector).textContent().catch(() => null)) || '').trim();

    // Build list of possible add-to-cart buttons
    const candidates = addSelectors.map(sel => card.locator(sel).first());
    const roleLink = card.getByRole('link', { name: /add to cart/i }).first();
    const roleButton = card.getByRole('button', { name: /add to cart/i }).first();

    const clicked = await clickFirstAvailable([...candidates, roleLink, roleButton], { force: true, timeoutMs: 3000 });
    if (!clicked) {
      console.log(`[WARN] Could not click add-to-cart for product: ${name}`);
      continue;
    }

    // Wait for modal to appear and dismiss it
    const appeared = await Promise.race([
      page.locator('#cartModal').waitFor({ state: 'visible', timeout: 3000 }).then(() => true),
      page.locator('.modal:visible').waitFor({ state: 'visible', timeout: 3000 }).then(() => true),
    ]).catch(() => false);
    
    if (appeared) {
      await dismissAnyModalIfVisible(page);
    }
    
    // Always add the name if we clicked (modal appearance is unreliable)
    if (name) names.push(name);
    await page.waitForLoadState('domcontentloaded').catch(() => {});
  }
  return names;
}


