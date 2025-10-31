import { test } from '@playwright/test';
import type { HomePage } from '../pages/HomePage';

export async function addFirstNProductsForBrands(homePage: HomePage, brands: string[], n: number): Promise<string[]> {
  const names: string[] = [];
  await test.step('Arrange: ensure home is loaded', async () => {
    await homePage.assertLoaded();
  });
  for (const brand of brands) {
    await test.step(`Act: add first ${n} products for brand: ${brand}`, async () => {
      names.push(...(await homePage.addFirstNProductsByBrand(brand, n)));
    });
  }
  return names;
}


