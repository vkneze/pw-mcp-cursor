/**
 * Cart page object:
 * Asserts cart table visibility and verifies a list of
 * expected product names are present in the cart.
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage, step } from '../pages/BasePage';
import { paths } from '../data/paths';
import { orderMessages } from '../data/order';
import { CART, SELECTORS as SELECT } from '../constants/selectors';

export class CartPage extends BasePage {
  readonly page: Page;
  readonly cartTable: Locator;
  readonly cartItemRows: Locator;
  readonly productNameCells: Locator;
  readonly headerCartLink: Locator;
  readonly visibleProductRows: Locator;
  readonly productRows: Locator;
  readonly productNameSelector: string;
  readonly visibleProductNameCells: Locator;
  readonly emptyCartMessage: Locator;
  readonly deleteButtons: Locator;
  readonly xDeleteLinks: Locator;
  readonly checkoutLink: Locator;
  readonly checkoutButton: Locator;
  readonly checkoutFallback: Locator;
  readonly placeOrderLink: Locator;
  readonly placeOrderButton: Locator;
  readonly nameOnCardInput: Locator;
  readonly cardNumberInput: Locator;
  readonly cvcInput: Locator;
  readonly expiryMonthInput: Locator;
  readonly expiryYearInput: Locator;
  readonly payButton: Locator;

  // Checkout login requirement
  readonly loginRequiredText: Locator;
  readonly loginOrSignupHeaderText: Locator;
  readonly checkoutLoginModal: Locator;
  readonly registerLoginLink: Locator;

  // Selector constants for row-scoped queries
  readonly deleteButtonSelector: string;
  readonly xDeleteLinkName: RegExp;
  
  // Payment form selectors (used in constructor and findReplacementPage)
  private readonly payButtonSelector = '[data-qa="pay-button"]';
  private readonly nameOnCardSelector = '[data-qa="name-on-card"]';

  constructor(page: Page) {
    super(page);
    this.page = page;

    // Locators
    this.cartTable = page.locator(CART.TABLE);
    this.cartItemRows = page.locator(`${CART.TABLE} tbody tr`);
    // Single resilient selector for cart item names
    this.productNameSelector = 'td.cart_description :is(h4 a, a, p)';
    this.productNameCells = page.locator(this.productNameSelector);
    this.visibleProductNameCells = page.locator(this.productNameSelector + ':visible');
    this.headerCartLink = page.getByText('Cart', { exact: true });
    // Derive rows from presence of product name cells
    this.productRows = page.locator(`${CART.TABLE} tbody tr:has(${this.productNameSelector})`);
    this.visibleProductRows = page.locator(`${CART.TABLE} tbody tr:has(${this.productNameSelector}:visible)`);

    // Additional page-level locators
    this.emptyCartMessage = page.getByText(/Cart is empty!/i);
    this.deleteButtons = page.locator(SELECT.CART_DELETE_BUTTONS);
    this.xDeleteLinks = page.getByRole('link', { name: /^x$/i });

    this.checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
    this.checkoutButton = page.getByRole('button', { name: /proceed to checkout/i });
    this.checkoutFallback = page.locator('a.check_out');

    this.placeOrderLink = page.getByRole('link', { name: /place order/i });
    this.placeOrderButton = page.getByRole('button', { name: /place order/i });

    this.nameOnCardInput = page.locator(this.nameOnCardSelector);
    this.cardNumberInput = page.locator('[data-qa="card-number"]');
    this.cvcInput = page.locator('[data-qa="cvc"]');
    this.expiryMonthInput = page.locator('[data-qa="expiry-month"]');
    this.expiryYearInput = page.locator('[data-qa="expiry-year"]');
    this.payButton = page.locator(this.payButtonSelector);

    // Checkout login requirement
    this.loginRequiredText = page.getByText(/register\s*\/\s*login|login is required|please login|account to proceed/i);
    this.loginOrSignupHeaderText = page.getByText(/login to your account|new user signup/i);
    this.checkoutLoginModal = page.locator('#checkoutModal, .modal:has-text("Register / Login"), .modal:has-text("login")');
    this.registerLoginLink = page.locator('a[href="/login"]').or(page.getByRole('link', { name: /register\s*\/\s*login|register|login/i }));

    // Selector constants
    this.deleteButtonSelector = 'a.cart_quantity_delete';
    this.xDeleteLinkName = /^x$/i;
  }

  /**
   * Sleep without relying on the Playwright Page to avoid errors if page closes.
   * @param ms - Milliseconds to sleep
   */
  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Periodically refresh the cart view to avoid stale DOM while waiting.
   * Refreshes approximately every second based on elapsed time.
   * @param startMs - The start timestamp (from Date.now())
   */
  private async periodicRefreshCartIfDue(startMs: number): Promise<void> {
    // Use a deterministic refresh cadence every ~1s instead of modulo windows
    const elapsedMs = Date.now() - startMs;
    const ticks = Math.floor(elapsedMs / 1000);
    // Store last tick on the page instance via symbol to avoid globals
    const key = '__cart_refresh_tick__' as const;
    const lastTick = (this as any)[key] ?? -1;
    if (ticks > lastTick) {
      (this as any)[key] = ticks;
      // Periodic refresh - failure is acceptable (page might be closed or navigating)
      await this.page.goto(paths.viewCart, { waitUntil: 'domcontentloaded' }).catch((err) => {
        // Navigation might fail if page is closed or already navigating
      });
      await this.ensureCartPageReady();
    }
  }

  /**
   * Get current visible product names for error messages and debugging.
   * @returns Array of visible product names in the cart
   */
  private async getVisibleProductNames(): Promise<string[]> {
    // Use visible cells if available, otherwise fall back to all cells
    const cellsToCheck = (await this.visibleProductNameCells.count()) 
      ? this.visibleProductNameCells 
      : this.productNameCells;
    
    const count = await cellsToCheck.count();
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const cell = cellsToCheck.nth(i);
      const text = (await cell.innerText().catch(async () => (await cell.textContent()) || '')) || '';
      const name = text.trim();
      if (name) names.push(name);
    }
    
    return names;
  }

  /**
   * Check if the given URL is a checkout or payment page.
   * @param url - The URL to check
   * @returns True if URL contains /checkout or /payment
   */
  private isCheckoutOrPaymentPage(url: string): boolean {
    return url.includes('/checkout') || url.includes('/payment');
  }

  /**
   * Try to find a live page that is on checkout/payment or has payment controls.
   * Useful when the original page closes during checkout flow.
   * @returns The found page or null if not found
   */
  private async findPaymentOrCheckoutPage(): Promise<Page | null> {
    try {
      const pages = this.page.context().pages().filter(p => !p.isClosed());
      // Prefer latest pages first - check URL first
      for (let i = pages.length - 1; i >= 0; i--) {
        const p = pages[i];
        if (this.isCheckoutOrPaymentPage(p.url())) return p;
      }
      // Heuristic by presence of controls
      for (let i = pages.length - 1; i >= 0; i--) {
        const p = pages[i];
        // Check for payment form elements - page might close during inspection
        const hasPayment = (await this.safeCount(p.locator(this.payButtonSelector))) > 0
          || (await this.safeCount(p.locator(this.nameOnCardSelector))) > 0;
        if (hasPayment) return p;
        
        const hasPlaceOrder = (await this.safeCount(p.getByRole('link', { name: /place order/i }))) > 0
          || (await this.safeCount(p.getByRole('button', { name: /place order/i }))) > 0;
        if (hasPlaceOrder) return p;
      }
    } catch (err) {
      console.log('[WARN] Error searching for payment/checkout page:', (err as Error).message);
    }
    return null;
  }

  /**
   * Handle page recovery by finding and switching to a live payment page.
   * @param params - Payment details to pass to the recovered page
   * @returns Result of placeOrder on the recovered page, or throws if no page found
   */
  private async recoverAndPlaceOrder(
    params: { nameOnCard: string; cardNumber: string; cvc: string; expiryMonth: string; expiryYear: string; }
  ): Promise<void> {
    const replacement = await this.findPaymentOrCheckoutPage().catch(() => null);
    if (replacement) {
      const fresh = new CartPage(replacement);
      return await fresh.placeOrder(params, true);
    }
    throw new Error('Cannot place order: page closed and no replacement page found');
  }

  /**
   * Fill the payment form with the provided card details.
   * @param params - Payment details including card information
   */
  private async fillPaymentForm(
    params: { nameOnCard: string; cardNumber: string; cvc: string; expiryMonth: string; expiryYear: string; }
  ): Promise<void> {
    await this.nameOnCardInput.fill(params.nameOnCard);
    await this.cardNumberInput.fill(params.cardNumber);
    await this.cvcInput.fill(params.cvc);
    await this.expiryMonthInput.fill(params.expiryMonth);
    await this.expiryYearInput.fill(params.expiryYear);
  }

  /**
   * Wait for payment form fields to become visible, with optional timeout.
   * @param timeout - Timeout in milliseconds (default: 8000)
   * @returns True if form is visible, false otherwise
   */
  private async isPaymentFormVisible(timeout: number = 8000): Promise<boolean> {
    return await Promise.race([
      this.safeWaitFor(this.nameOnCardInput, { state: 'visible', timeout }),
      this.safeWaitFor(this.cardNumberInput, { state: 'visible', timeout }),
      this.safeWaitFor(this.payButton, { state: 'visible', timeout }),
    ]);
  }

  /**
   * Ensure payment form is visible by clicking "Place Order" trigger if needed.
   * Only clicks the trigger if payment form is not already visible.
   */
  private async ensurePaymentFormVisible(): Promise<void> {
    // Quick check: is form already visible?
    const alreadyVisible = await this.isPaymentFormVisible(1000);
    if (alreadyVisible) return;

    // Form not visible yet - try clicking "Place Order" button to reveal it
    const placeOrderTrigger = this.placeOrderLink.or(this.placeOrderButton);
    const triggerCount = await placeOrderTrigger.count().catch(() => 0);
    
    if (triggerCount > 0) {
      await placeOrderTrigger.first().click({ force: true }).catch(() => {
        // Click failed - will check form visibility below
      });
      await this.safeWaitForLoadState('domcontentloaded');
    }
  }

  /**
   * Wait until cart count equals expected value.
   * @param expected - The expected cart item count
   * @param timeoutMs - Maximum time to wait in milliseconds (default: 15000)
   * @returns True on success, false on timeout
   */
  private async waitForCountToEqual(expected: number, timeoutMs: number = 15000): Promise<boolean> {
    await this.ensureCartPageReady();
    return await this.waitUntil(
      async () => (await this.getCartItemCount()) === expected,
      { timeout: timeoutMs, interval: 200 }
    );
  }

  /**
   * Get current cart item count.
   * @returns Number of visible product rows in the cart
   */
  private async getCartItemCount(): Promise<number> {
    return await this.safeCount(this.visibleProductRows);
  }

  /**
   * Wait for either the cart table or the empty-cart message to be visible.
   * @param timeoutMs - Maximum time to wait in milliseconds (default: 12000)
   * @returns True if either signal appeared, false on timeout
   */
  private async waitForCartReadySignals(timeoutMs: number = 12000): Promise<boolean> {
    const table = this.cartTable;
    const emptyMsg = this.emptyCartMessage;
    return await Promise.race([
      this.safeWaitFor(table, { state: 'visible', timeout: timeoutMs }),
      this.safeWaitFor(emptyMsg, { state: 'visible', timeout: timeoutMs }),
    ]);
  }

  /**
   * Check if the current URL is the cart page.
   * @returns True if on cart page, false otherwise
   */
  private isOnCartPage(): boolean {
    return this.page.url().includes('/view_cart');
  }

  /**
   * Ensure we're on the cart page and DOM is ready for queries.
   * Attempts to navigate to cart page and wait for ready signals with retries.
   */
  private async ensureCartPageReady(): Promise<void> {
    if (this.page.isClosed()) return; // Let caller handle if needed

    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (!this.isOnCartPage()) {
          await this.page.goto(paths.viewCart, { waitUntil: 'domcontentloaded' });
        }
      } catch (err) {
        // Navigation might be aborted - will retry in next iteration
        console.log(`[INFO] Cart navigation attempt ${attempt + 1} failed:`, (err as Error).message);
      }

      // Wait for page to settle before checking cart readiness
      await this.safeWaitForLoadState('domcontentloaded');

      const ok = await this.waitForCartReadySignals(8000);
      if (ok) return;

      // Brief pause before next attempt; if page closed, bail
      if (this.page.isClosed()) return;
      await this.page.waitForTimeout(150);
    }
  }

  /**
   * Wait for the cart view to be fully ready for interaction.
   */
  @step('Wait for cart view to be ready')
  async waitForCartReady(): Promise<void> {
    await this.ensureCartPageReady();
  }

  /**
   * Assert that specific products are present in the cart.
   * @param expectedNames - Array of product names (or fragments) to verify
   * @throws {Error} If any expected product is not found in cart
   */
  @step('Assert products in cart')
  async assertProductsInCart(expectedNames: string[]): Promise<void> {
    await this.ensureCartPageReady();
    let names = await this.getVisibleProductNames();
    if (names.length === 0) {
      // Briefly wait and retry to avoid race with cart rendering
      const end = Date.now() + 4000;
      while (names.length === 0 && Date.now() < end) {
        await this.page.waitForTimeout(150);
        await this.ensureCartPageReady();
        names = await this.getVisibleProductNames();
      }
    }

    for (const expected of expectedNames) {
      const expectedLc = expected.toLowerCase();
      const found = names.some(n => n.toLowerCase().includes(expectedLc));
      if (!found) {
        throw new Error(
          `Expected to find product containing "${expected}" in cart, but it was not found. Got: ${names.join(', ')}`
        );
      }
    }
  }

  /**
   * Assert that the cart contains at least the specified number of items.
   * @param minExpected - Minimum expected number of items in cart
   */
  @step('Assert cart has at least N items')
  async assertCartItemsCount(minExpected: number): Promise<void> {
    await this.ensureCartPageReady();
    let count: number;
    try {
      count = await this.visibleProductRows.count();
    } catch (err) {
      // Count might fail if page is navigating - re-ensure and retry
      console.log('[INFO] Initial count failed, re-ensuring cart ready:', (err as Error).message);
      await this.ensureCartPageReady();
      count = await this.visibleProductRows.count();
    }
    expect(count).toBeGreaterThanOrEqual(minExpected);
  }

  /**
   * Find the index of the first cart row matching the given product name fragment.
   * @param nameFragment - Part of the product name to search for (case-insensitive)
   * @returns Row index if found, -1 if not found
   */
  private async findProductRowIndex(nameFragment: string): Promise<number> {
    const nameRegex = new RegExp(this.escapeForRegex(nameFragment), 'i');
    const count = await this.cartItemRows.count();
    
    for (let i = 0; i < count; i++) {
      const nameCell = this.productNameCells.nth(i);
      if (await nameCell.count()) {
        const text = ((await nameCell.textContent()) || '').trim();
        if (nameRegex.test(text)) {
          return i;
        }
      }
    }
    return -1;
  }

  /**
   * Remove the first cart item that matches the given product name fragment.
   * @param nameFragment - Part of the product name to search for (case-insensitive)
   * @throws {Error} If no matching product is found
   */
  @step('Remove first cart item matching product name')
  async removeProductByName(nameFragment: string): Promise<void> {
    await this.ensureCartPageReady();
    const beforeCount = await this.getCartItemCount();
    
    // Find the matching product row
    const rowIndex = await this.findProductRowIndex(nameFragment);
    if (rowIndex === -1) {
      throw new Error(`Product not found in cart to remove: ${nameFragment}`);
    }

    // Click delete button for the found row
    const row = this.cartItemRows.nth(rowIndex);
    const deleteLink = this.deleteButtons.nth(rowIndex).or(this.xDeleteLinks.nth(rowIndex));
    await deleteLink.first().click();
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for removal to complete
    await this.safeWaitFor(row, { state: 'detached' });
    await this.waitUntil(
      async () => (await this.getCartItemCount()) <= Math.max(0, beforeCount - 1),
      { timeout: 5000, description: 'cart count to decrease after removal' }
    );
  }

  /**
   * Check if the cart is currently empty.
   * @returns True if cart is empty, false otherwise
   */
  private async isCartEmpty(): Promise<boolean> {
    const emptyMsgVisible = await this.safeIsVisible(this.emptyCartMessage);
    const itemCount = await this.getCartItemCount();
    return emptyMsgVisible || itemCount === 0;
  }

  /**
   * Remove all items from the cart one by one until cart is empty.
   * @throws {Error} If cart is not empty after maximum iterations
   */
  @step('Remove all items from cart')
  async removeAllItems(): Promise<void> {
    await this.ensureCartPageReady();

    // Early exit if already empty
    if (await this.isCartEmpty()) return;

    const maxIterations = 50;
    for (let i = 0; i < maxIterations; i++) {
      // Stop if cart is now empty
      if (await this.isCartEmpty()) return;

      // Remove first item
      const itemCount = await this.getCartItemCount();
      if (itemCount === 0) return;
      
      await this.removeFirstItem();
    }

    // Final check - if we hit max iterations and cart still not empty, throw error
    if (!(await this.isCartEmpty())) {
      const remaining = await this.getCartItemCount();
      throw new Error(`Cart not empty after ${maxIterations} removal attempts. Remaining items: ${remaining}`);
    }
  }

  /**
   * Assert that the cart is empty (either shows empty message or has 0 items).
   * @throws {Error} If cart is not empty
   */
  @step('Assert cart is empty')
  async assertCartEmpty(): Promise<void> {
    await this.ensureCartPageReady();
    const isEmpty = await this.waitUntil(
      async () => {
        const count = await this.getCartItemCount();
        const msgVisible = await this.safeIsVisible(this.emptyCartMessage);
        return msgVisible || count === 0;
      },
      { timeout: 15000 }
    );
    if (!isEmpty) {
      const remaining = await this.getCartItemCount();
      throw new Error(`Expected empty cart but found ${remaining} item(s).`);
    }
  }

  /**
   * Assert that the cart contains exactly the specified number of items.
   * @param expected - Expected exact number of items in cart
   * @throws {Error} If cart item count doesn't match expected
   */
  @step('Assert cart has exactly N items')
  async assertCartItemsExactCount(expected: number): Promise<void> {
    if (expected === 0) {
      await this.assertCartEmpty();
      return;
    }
    await this.ensureCartPageReady();
    const ok = await this.waitForCountToEqual(expected, 15000);
    if (ok) return;
    await this.ensureCartPageReady();
    const currentCount = await this.getCartItemCount();
    const names = await this.getVisibleProductNames();
    throw new Error(`Timed out waiting for cart to have ${expected} items. Got ${currentCount}. Items: ${names.join(', ')}`);
  }

  /**
   * Get the current number of items in the cart.
   * @returns Current cart item count
   */
  @step('Get cart items count')
  async getCartItemsCount(): Promise<number> {
    await this.ensureCartPageReady();
    return await this.getCartItemCount();
  }

  /**
   * Wait until the cart contains exactly the specified number of items.
   * @param expected - Expected exact number of items
   * @param timeoutMs - Maximum time to wait in milliseconds (default: 20000)
   * @throws {Error} If timeout is reached before cart count matches
   */
  @step((expected: number, timeoutMs: number = 5000) => `Wait until cart has exactly ${expected} items`)
  async waitForCartItemsExactCount(expected: number, timeoutMs: number = 20000): Promise<void> {
    const ok = await this.waitForCountToEqual(expected, timeoutMs);
    if (ok) return;
    const currentCount = await this.getCartItemCount();
    const names = await this.getVisibleProductNames();
    throw new Error(`Timed out waiting for cart to have ${expected} items. Got ${currentCount}. Items: ${names.join(', ')}`);
  }

  /**
   * Remove the first item from the cart.
   */
  @step('Remove first item from cart')
  async removeFirstItem(): Promise<void> {
    await this.ensureCartPageReady();
    const before = await this.getCartItemCount();
    if (before === 0) return;
    const firstRow = this.productRows.first();
    const deleteBtn = this.deleteButtons.first().or(this.xDeleteLinks.first());
    if (!(await deleteBtn.count())) return;
    
    // Try force click first, fallback to DOM click if needed
    const clicked = await this.safeClick(deleteBtn, { force: true });
    
    if (!clicked) {
      // Fallback to DOM click
      const handle = await deleteBtn.elementHandle().catch(() => null);
      if (handle) {
        await this.page.evaluate((el) => (el as HTMLElement).click(), handle);
      }
    }
    
    // Wait for item removal - use safe wait with longer timeout
    const detached = await this.safeWaitFor(firstRow, { state: 'detached', timeout: 10000 });
    
    // If row didn't detach, wait for count to change as fallback verification
    if (!detached) {
      await this.safeWaitForLoadState('domcontentloaded');
    }
    
    await this.waitForCountToEqual(Math.max(0, before - 1), 8000);
  }

  /**
   * Click the checkout button to proceed to the checkout page.
   * Waits for either the checkout page or login prompt to appear.
   */
  @step('Proceed to checkout from cart')
  async proceedToCheckout(): Promise<void> {
    if (await this.checkoutLink.count()) {
      await this.checkoutLink.click();
    } else if (await this.checkoutButton.count()) {
      await this.checkoutButton.click();
    } else {
      // Fallback known selector
      await this.checkoutFallback.click();
    }
    
    // Wait for one of the checkout outcomes: URL or login indicators
    const timeoutMs = 20000;
    const checkoutOrLoginUrl = (url: URL) => {
      const path = url.pathname;
      return path.includes('/checkout') || path.includes('/login') || path.includes('/signup');
    };
    
    const urlPromise = this.safeWaitForURL(checkoutOrLoginUrl, { timeout: timeoutMs });
    const headerPromise = this.safeWaitFor(this.loginOrSignupHeaderText, { state: 'visible', timeout: timeoutMs });
    const modalPromise = this.safeWaitFor(this.checkoutLoginModal, { state: 'visible', timeout: timeoutMs });
    const ctaPromise = this.safeWaitFor(this.registerLoginLink, { state: 'visible', timeout: timeoutMs });
    
    // Wait for any checkout indicator - all inner promises handle errors, timeout is acceptable
    await Promise.race([urlPromise, headerPromise, modalPromise, ctaPromise]).catch((err) => {
      // All race conditions handled by inner promises, outer timeout is acceptable
    });
    
    // Let network settle before next steps
    await this.safeWaitForLoadState('networkidle');
  }

  /**
   * Place an order by filling payment form and submitting it.
   * Handles page replacement/closure during checkout flow.
   * @param params - Payment details including card information
   * @param _recovered - Internal flag to prevent infinite recovery loops
   * @throws {Error} If payment form is not found or page is closed
   */
  @step('Place order with payment details')
  async placeOrder(
    params: { nameOnCard: string; cardNumber: string; cvc: string; expiryMonth: string; expiryYear: string; },
    _recovered: boolean = false,
  ): Promise<void> {
    // Check page state and recover if needed
    if (this.page.isClosed()) {
      if (_recovered) {
        throw new Error('Cannot place order: page is already closed');
      }
      return await this.recoverAndPlaceOrder(params);
    }

    // Ensure payment form is visible (clicks "Place Order" button if needed)
    await this.ensurePaymentFormVisible();

    // Check if page closed after interaction, recover if needed
    if (this.page.isClosed()) {
      if (_recovered) {
        throw new Error('Page closed after ensuring form visibility');
      }
      return await this.recoverAndPlaceOrder(params);
    }

    // Verify payment form is now visible - if not, something is wrong
    if (!(await this.isPaymentFormVisible())) {
      const currentUrl = this.page.isClosed() ? '<closed>' : this.page.url();
      throw new Error(`Payment form not visible after attempting to reveal it. URL=${currentUrl}`);
    }

    // Fill and submit payment form
    await this.fillPaymentForm(params);
    await this.payButton.click();

    // Assert success
    await expect(this.page.getByText(orderMessages.successMessage, { exact: false })).toBeVisible();
  }

  /**
   * Check if the current URL is a login or signup page.
   * @param url - The URL to check
   * @returns True if URL contains /login or /signup
   */
  private isLoginOrSignupPage(url: string): boolean {
    return url.includes('/login') || url.includes('/signup');
  }

  /**
   * Check if the current URL is a checkout page.
   * @param url - The URL to check
   * @returns True if URL contains /checkout
   */
  private isCheckoutPage(url: string): boolean {
    return url.includes('/checkout');
  }

  /**
   * Assert that the checkout flow requires login by checking for login prompts or redirects.
   * @throws {Error} If no login requirement is detected
   */
  @step('Assert checkout prompts for login')
  async assertCheckoutRequiresLogin(): Promise<void> {
    const loginDetected = await this.waitUntil(
      async () => {
        const url = this.page.url();
        
        // Check if redirected to login/signup page
        if (this.isLoginOrSignupPage(url)) return true;

        // Check for visible login indicators
        const [headerVisible, modalVisible, inlineMsgVisible, regLinkCount] = await Promise.all([
          this.safeIsVisible(this.loginOrSignupHeaderText),
          this.safeIsVisible(this.checkoutLoginModal),
          this.safeIsVisible(this.loginRequiredText),
          this.safeCount(this.registerLoginLink),
        ]);

        if (headerVisible || modalVisible || inlineMsgVisible) return true;

        // Check if on checkout page with login link present
        return this.isCheckoutPage(url) && regLinkCount > 0;
      },
      { timeout: 15000 }
    );
    
    if (!loginDetected) {
      throw new Error(`Expected checkout to require login, but no prompt was detected. URL: ${this.page.url()}`);
    }
  }
}
