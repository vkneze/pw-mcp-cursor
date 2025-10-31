import { test } from '@playwright/test';
import type { AuthPage } from '../pages/AuthPage';
import type { HomePage } from '../pages/HomePage';
import type { CartPage } from '../pages/CartPage';
import { login as performLogin } from '../actions/LoginActions';

export type RuntimeUser = { email: string; password: string; name?: string };

export type BrandOrderOptions = {
  /** Whether to perform login as part of the flow. */
  login: boolean;
  /** When to login: before adding products or right before checkout. */
  loginAt?: 'beforeAdd' | 'beforeCheckout';
  /** Brand names to add from, in order. */
  brands: string[];
  /** How many items to add per brand. */
  itemsPerBrand: number;
  /** Payment payload used at checkout. */
  payment: { nameOnCard: string; cardNumber: string; cvc: string; expiryMonth: string; expiryYear: string };
  /** Runtime user credentials; required when login=true. */
  user?: RuntimeUser;
};

/**
 * Execute a brand-based add-to-cart flow with optional login and full checkout.
 * This consolidates the duplicated logic from cart-brand-flow tests.
 */
export async function runBrandOrderFlow(
  pages: { authPage: AuthPage; homePage: HomePage; cartPage: CartPage },
  opts: BrandOrderOptions,
): Promise<void> {
  const { authPage, homePage, cartPage } = pages;
  const {
    login,
    loginAt = 'beforeCheckout',
    brands,
    itemsPerBrand,
    payment,
    user,
  } = opts;

  const expectedCartProductNames: string[] = [];

  await test.step('Arrange: ensure home is loaded', async () => {
    await homePage.assertLoaded();
  });

  if (login && loginAt === 'beforeAdd') {
    if (!user) throw new Error('runBrandOrderFlow: user is required when login=true');
    await test.step('Act: login before adding products', async () => {
      await performLogin(authPage, user);
    });
  }

  for (const brand of brands) {
    await test.step(`Act: add first ${itemsPerBrand} products for brand: ${brand}`, async () => {
      expectedCartProductNames.push(...(await homePage.addFirstNProductsByBrand(brand, itemsPerBrand)));
    });
  }

  if (login && loginAt === 'beforeCheckout') {
    if (!user) throw new Error('runBrandOrderFlow: user is required when login=true');
    await test.step('Act: login before checkout', async () => {
      await performLogin(authPage, user);
    });
  }

  await test.step('Assert: open cart and verify selected products are present', async () => {
    await homePage.openCartFromHeader();
    await cartPage.waitForCartItemsExactCount(expectedCartProductNames.length, 15000).catch(() => {});
    await cartPage.assertProductsInCart(expectedCartProductNames);
  });

  await test.step('Checkout: proceed and place order', async () => {
    await cartPage.proceedToCheckout();
    await cartPage.placeOrder(payment);
  });
}


