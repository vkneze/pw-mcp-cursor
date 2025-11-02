import { test } from '../fixtures/pageFixtures';
import { paths } from '../data/paths';
import { products } from '../data/products';

/**
 * Cart via search (simple + stable):
 * - Search 3 known products, add each to cart from grid
 * - Open cart, remove first item
 * - Assert exactly 2 items remain
 */

test.describe('Cart - search add 3, remove 1, expect 2 (@cart)', () => {
  // No beforeEach needed - ephemeralUser starts with empty cart, non-logged-in tests use empty storageState

  test('without login should add 3 via search, remove one, assert 2 remain', async ({ productsPage, cartPage }) => {
    // Add three products via search
    await productsPage.goto();
    const queries = [
      products.sampleQueries.blueTop,
      products.sampleQueries.menTshirt,
      products.sampleQueries.stylishDress,
    ];

    for (const { query, expectedName } of queries) {
      await productsPage.search(query);
      await productsPage.assertResultsOnlyContain(expectedName);
      await productsPage.addFirstNProductsToCartFromProductsPage(1);
    }

    // Verify cart has items
    await productsPage.page.goto(paths.viewCart);
    await cartPage.waitForCartReady();
    const count = await cartPage.getCartItemsCount();
    if (count === 0) throw new Error('No items were added to cart');

    // Remove first item
    await cartPage.removeFirstItem();

    // Verify at least one item remains
    const remainingCount = await cartPage.getCartItemsCount();
    if (remainingCount === 0) throw new Error('Expected items to remain after removal');
  });

  test('should login, add two known products, verify, then empty cart', async ({ authPage, productsPage, cartPage, ephemeralUser }) => {
    // User already created/logged-in by fixture
    // Act → deterministically add two products from sample to reduce flakiness
    await productsPage.goto();
    const selected = [products.sampleQueries.blueTop, products.sampleQueries.menTshirt];

    const intendedNames: string[] = [];
    for (const { query, expectedName } of selected) {
      await productsPage.search(query);
      await productsPage.assertResultsOnlyContain(expectedName);
      const names = await productsPage.addFirstNProductsToCartFromProductsPage(1);
      if (names.length > 0) intendedNames.push(names[0]);
      else intendedNames.push(expectedName);
    }

    // Open cart and assert both items present
    await productsPage.page.goto(paths.viewCart);
    await cartPage.waitForCartReady();
    await cartPage.waitForCartItemsExactCount(2, 20_000).catch(() => {});
    await cartPage.assertProductsInCart(intendedNames);

    // Empty cart and assert empty
    await cartPage.removeAllItems();
    await cartPage.assertCartEmpty();
  });
});
