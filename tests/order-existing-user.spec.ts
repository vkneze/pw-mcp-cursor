import { test } from '../fixtures/pageFixtures';
import { paths } from '../data/paths';
import { orderPayment } from '../data/order';
import { checkoutAndPlaceOrder } from '../actions/CartActions';

/**
 * Order flow (existing user):
 * - Login using per-project runtime user from fixtures
 * - Navigate to Products page and add two products to cart (from grid, no new tabs)
 * - Proceed to checkout and place order
 * - Assert success message "Order Completed!"
 *
 * Notes:
 * - Uses MCP-integrated fixtures via page objects.
 */
test.describe('Order - Existing user completes checkout (@order)', () => {
  // No beforeEach needed - ephemeralUser starts with empty cart

  // @flaky: Parallel workers and modal overlays can slow cart stabilization; allow extra time.
  test('should login, add two products from products page, and complete order successfully (@flaky)', async ({ productsPage, cartPage, ephemeralUser }) => {
    console.log(`[TEST] Project=${test.info().project.name} UsingUser=${ephemeralUser.email}`);
    // User is already created and logged in by the ephemeralUser fixture

    // Add two products from products page
    await productsPage.goto();
    await productsPage.addFirstNProductsToCartFromProductsPage(2);
    
    // Verify cart
    await productsPage.page.goto(paths.viewCart);
    await cartPage.waitForCartReady();
    const count = await cartPage.getCartItemsCount();
    if (count === 0) throw new Error('No items were added to cart');
    
    // Checkout and place order (includes "Order Placed!" assertion)
    await checkoutAndPlaceOrder(cartPage, orderPayment);
  });
});


