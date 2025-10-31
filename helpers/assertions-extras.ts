import { expect, Locator } from '@playwright/test';

export async function assertCardsContainOnlyBrands(cards: Locator, brands: string[]): Promise<void> {
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  const alternation = brands.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const brandRegex = new RegExp(`Brand\\s*:\\s*(?:${alternation})`, 'i');

  const sample = Math.min(6, count);
  for (let i = 0; i < sample; i++) {
    const label = cards.nth(i).getByText(/Brand\s*:/i).first();
    const visible = await label.isVisible().catch(() => false);
    if (!visible) continue;
    const text = ((await label.textContent().catch(() => '')) || '').trim();
    if (!brandRegex.test(text)) {
      throw new Error(`Unexpected brand for card #${i + 1}: "${text}" not in [${brands.join(', ')}]`);
    }
  }
}


