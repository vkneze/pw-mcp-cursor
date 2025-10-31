import { test } from '@playwright/test';
import type { CartPage } from '../pages/CartPage';
import type { HomePage } from '../pages/HomePage';
import type { ProductsPage } from '../pages/ProductsPage';
import { paths } from '../data/paths';

/**
 * Cart Actions - High-level orchestration functions that combine multiple page actions.
 * These functions coordinate between HomePage, ProductsPage, and CartPage.
 * For single-page actions, call CartPage methods directly in tests.
 */

// Shared types
export type Payment = { nameOnCard: string; cardNumber: string; cvc: string; expiryMonth: string; expiryYear: string };
export type QueryItem = { query: string; expectedName: string };

/** Open cart from header and verify expected items are present */
export async function openAndVerifyCart(homePage: HomePage, cartPage: CartPage, expectedNames: string[]): Promise<void> {
  await test.step('Cart: open from header and verify items', async () => {
    await homePage.openCartFromHeader();
    await cartPage.waitForCartItemsExactCount(expectedNames.length, 20000);
    await cartPage.assertProductsInCart(expectedNames);
  });
}

/** Navigate to cart and ensure it has exact count */
export async function ensureCartHasCount(
  productsPage: ProductsPage,
  cartPage: CartPage,
  expectedCount: number,
  timeoutMs: number = 20000,
): Promise<void> {
  await test.step(`Cart: ensure exactly ${expectedCount} items`, async () => {
    await productsPage.page.goto(paths.viewCart);
    await cartPage.waitForCartReady();
    await cartPage.waitForCartItemsExactCount(expectedCount, timeoutMs);
  });
}

/** Complete checkout flow: proceed to checkout, place order, and verify success */
export async function checkoutAndPlaceOrder(cartPage: CartPage, payment: Payment): Promise<void> {
  await test.step('Cart: checkout and place order', async () => {
    await cartPage.proceedToCheckout();
    await cartPage.placeOrder(payment);
    await cartPage.page.getByText('Order Placed!', { exact: false }).waitFor({ state: 'visible', timeout: 5000 });
  });
}

/** Search for a product, add it to cart, and navigate to cart page */
export async function ensureItemInCart(
  productsPage: ProductsPage,
  cartPage: CartPage,
  name: string,
  lookup: QueryItem[],
): Promise<void> {
  await test.step(`Cart: ensure item in cart → ${name}`, async () => {
    const lowered = name.toLowerCase();
    const match = lookup.find(it => it.expectedName.toLowerCase() === lowered);
    const query = match?.query ?? name;
    const expectedName = match?.expectedName ?? name;
    
    await productsPage.goto();
    await productsPage.search(query);
    await productsPage.assertResultsOnlyContain(expectedName);
    await productsPage.addFirstNProductsToCartFromProductsPage(1);
    await productsPage.page.goto(paths.viewCart);
    await cartPage.waitForCartReady();
  });
}


