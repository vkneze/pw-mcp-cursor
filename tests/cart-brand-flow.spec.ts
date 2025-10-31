import { test } from '../fixtures/pageFixtures';
import { orderPayment } from '../data/order';
import { filters } from '../data/filters';
import { addFirstNProductsForBrands } from '../actions/ProductActions';
import { checkoutAndPlaceOrder } from '../actions/CartActions';

/**
 * Cart flow tests: filter products by brand on the home page,
 * add a subset to the cart, then verify they appear in the cart.
 */
test.describe('Cart flow - add products by brand', () => {
  test.beforeEach(async ({ homePage }, testInfo) => {
    // Clear storage for non-logged-in tests
    const usesEphemeralUser = testInfo.title.includes('should login');
    if (!usesEphemeralUser) {
      await homePage.page.context().clearCookies();
    }
    await homePage.goto();
    if (!usesEphemeralUser) {
      await homePage.page.evaluate(() => localStorage.clear()).catch(() => {});
    }
  });


  /**
   * Order flow without login using brand filters (@order)
   * - Adds products by two brands (no logged user)
   * - Proceeds to checkout 
   * - Asserts checkout modal which says login is required to complete order
   */
  // @flaky: External site occasionally serves slow content or intermittent modals causing timing variance.
  test('(@flaky) should add products from Polo and H&M and verify in cart', async ({ authPage, homePage, cartPage }) => {
    await addFirstNProductsForBrands(homePage, [filters.brandPolo.name, filters.brandHM.name], 2);
    await homePage.openCartFromHeader();
    await cartPage.waitForCartReady();
    
    const count = await cartPage.getCartItemsCount();
    if (count === 0) throw new Error('No items were added to cart');
    
    await cartPage.proceedToCheckout();
    await cartPage.assertCheckoutRequiresLogin();
  });

  /**
   * Login and complete order using brand filters (@order)
   * - Logs in with existing runtime user
   * - Adds products by two brands
   * - Proceeds to checkout and places order
   * - Asserts final success message
   */
  // @flaky: Brand-filtered add-to-cart is unreliable on the website
  test('(@flaky) should login, add brand-filtered products, and place order successfully', async ({ authPage, homePage, cartPage, ephemeralUser }) => {
    console.log(`[TEST] Project=${test.info().project.name} UsingUser=${ephemeralUser.email}`);
    
    await addFirstNProductsForBrands(homePage, [filters.brandPolo.name, filters.brandHM.name], 2);
    await homePage.openCartFromHeader();
    await cartPage.waitForCartReady();
    
    const count = await cartPage.getCartItemsCount();
    if (count === 0) throw new Error('No items were added to cart');
    
    await checkoutAndPlaceOrder(cartPage, orderPayment);
  });
});
