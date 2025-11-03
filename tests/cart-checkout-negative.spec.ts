import { test } from '../fixtures/pageFixtures';
import { expect } from '@playwright/test';

/**
 * Negative test cases for cart checkout flow.
 * Tests scenarios where checkout should be restricted or fail.
 */
test.describe('Cart - Checkout Negative Scenarios', () => {

  /**
   * Verify that guest users (not logged in) cannot proceed to checkout.
   * Expected: User should be prompted to login or redirected to login page.
   */
  test('should require login when trying to checkout as guest', async ({ homePage, cartPage }) => {
    // Add products to cart without logging in
    await homePage.goto();
    await homePage.addFirstNProductsByBrand('Polo', 2);
    
    // Go to cart and verify items are there
    await cartPage.goto();
    await cartPage.assertCartItemsExactCount(2);
    
    // Try to proceed to checkout
    await cartPage.proceedToCheckout();
    
    // Assert that checkout requires login
    await cartPage.assertCheckoutRequiresLogin();
  });

  /**
   * Verify that users cannot proceed to checkout when cart is empty.
   * Expected: Checkout button is unavailable or shows empty cart message.
   */
  test('should not allow checkout with empty cart', async ({ cartPage, authPage, ephemeralUser }) => {
    // Login first (user already logged in via fixture)
    
    // Go to cart page directly (cart is empty)
    await cartPage.goto();
    
    // Assert cart is empty
    await cartPage.assertCartEmpty();
    
    // Checkout button should not be available or should show error
    const checkoutVisible = await cartPage.checkoutButton.isVisible().catch(() => false)
      || await cartPage.checkoutLink.isVisible().catch(() => false);
    
    if (checkoutVisible) {
      // If checkout button exists, clicking it should not proceed
      await cartPage.proceedToCheckout();
      
      // Should stay on cart page or show error
      const currentUrl = cartPage.page.url();
      expect(currentUrl).toContain('/view_cart');
    }
  });

  /**
   * Verify that cart items remain in cart after a failed checkout attempt.
   * Expected: Cart contents should be preserved when user returns to cart page.
   */
  test('should persist cart items after failed checkout attempt', async ({ homePage, cartPage }) => {
    // Add products to cart as guest
    await homePage.goto();
    await homePage.addFirstNProductsByBrand('Polo', 2);
    
    // Go to cart and get product count
    await cartPage.goto();
    const originalCount = await cartPage.getCartItemsCount();
    expect(originalCount).toBeGreaterThan(0);
    
    // Try to checkout (will fail - no login)
    await cartPage.proceedToCheckout();
    await cartPage.assertCheckoutRequiresLogin();
    
    // Go back to cart
    await cartPage.goto();

    // Verify cart items count is still the same
    const currentCount = await cartPage.getCartItemsCount();
    expect(currentCount).toBe(originalCount);

  });

  /**
   * Verify that logged-in users cannot proceed to payment after emptying their cart.
   * Expected: Checkout should be unavailable or show empty cart message.
   */
  test('should not allow proceeding to payment without items', async ({ cartPage, authPage, homePage, ephemeralUser }) => {
    // User already logged in via fixture
    
    // Add item to cart
    await homePage.goto();
    await homePage.addFirstNProductsByBrand('Polo', 1);
    
    // Go to cart
    await cartPage.goto();
    
    // Remove all items
    await cartPage.removeAllItems();
    await cartPage.assertCartEmpty();
    
    // Try to proceed to checkout (button might not be available)
    const hasCheckoutButton = await cartPage.checkoutButton.isVisible().catch(() => false)
      || await cartPage.checkoutLink.isVisible().catch(() => false);
    
    if (hasCheckoutButton) {
      await cartPage.proceedToCheckout();
      
      // Should stay on cart page or show error
      await expect(cartPage.emptyCartMessage).toBeVisible();
    }
  });
});

