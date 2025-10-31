/**
 * Cart page object:
 * Asserts cart table visibility and verifies a list of
 * expected product names are present in the cart.
 */
import { Page, Locator, expect } from '@playwright/test';
import { BasePage, step } from '../pages/BasePage';
import { paths } from '../data/paths';
import { assertVisible } from '../helpers/assertions';
import { CART, SELECTORS as SELECT } from '../helpers/selectors';

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

    this.nameOnCardInput = page.locator('[data-qa="name-on-card"]');
    this.cardNumberInput = page.locator('[data-qa="card-number"]');
    this.cvcInput = page.locator('[data-qa="cvc"]');
    this.expiryMonthInput = page.locator('[data-qa="expiry-month"]');
    this.expiryYearInput = page.locator('[data-qa="expiry-year"]');
    this.payButton = page.locator('[data-qa="pay-button"]');

    // Checkout login requirement
    this.loginRequiredText = page.getByText(/register\s*\/\s*login|login is required|please login|account to proceed/i);
    this.loginOrSignupHeaderText = page.getByText(/login to your account|new user signup/i);
    this.checkoutLoginModal = page.locator('#checkoutModal, .modal:has-text("Register / Login"), .modal:has-text("login")');
    this.registerLoginLink = page.locator('a[href="/login"]').or(page.getByRole('link', { name: /register\s*\/\s*login|register|login/i }));

    // Selector constants
    this.deleteButtonSelector = 'a.cart_quantity_delete';
    this.xDeleteLinkName = /^x$/i;
  }

  /** Sleep without relying on the Playwright Page (avoids errors if page closes). */
  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Periodically refresh the cart view to avoid stale DOM while waiting. */
  private async periodicRefreshCartIfDue(startMs: number): Promise<void> {
    // Use a deterministic refresh cadence every ~1s instead of modulo windows
    const elapsedMs = Date.now() - startMs;
    const ticks = Math.floor(elapsedMs / 1000);
    // Store last tick on the page instance via symbol to avoid globals
    const key = '__cart_refresh_tick__' as const;
    const lastTick = (this as any)[key] ?? -1;
    if (ticks > lastTick) {
      (this as any)[key] = ticks;
      await this.page.goto(paths.viewCart, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await this.ensureCartPageReady();
    }
  }

  /** Get current visible product names for error messages/debugging. */
  private async getVisibleProductNames(): Promise<string[]> {
    const loc = (await this.visibleProductNameCells.count()) ? this.visibleProductNameCells : this.productNameCells;
    const count = await loc.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const txt = (await loc.nth(i).innerText().catch(async () => (await loc.nth(i).textContent()) || '')) || '';
      const name = txt.trim();
      if (name) names.push(name);
    }
    return names;
  }

  /** Try to find a live page that is on checkout/payment or has payment controls. */
  private async findPaymentOrCheckoutPage(): Promise<Page | null> {
    try {
      const pages = this.page.context().pages().filter(p => !p.isClosed());
      // Prefer latest pages first
      for (let i = pages.length - 1; i >= 0; i--) {
        const p = pages[i];
        const url = p.url();
        if (/\/(checkout|payment)\b/i.test(url)) return p;
      }
      // Heuristic by presence of controls
      for (let i = pages.length - 1; i >= 0; i--) {
        const p = pages[i];
        try {
          const hasPayment = (await p.locator('[data-qa="pay-button"]').count().catch(() => 0)) > 0
            || (await p.locator('[data-qa="name-on-card"]').count().catch(() => 0)) > 0;
          if (hasPayment) return p;
          const hasPlaceOrder = (await p.getByRole('link', { name: /place order/i }).count().catch(() => 0)) > 0
            || (await p.getByRole('button', { name: /place order/i }).count().catch(() => 0)) > 0;
          if (hasPlaceOrder) return p;
        } catch {}
      }
    } catch {}
    return null;
  }

  /**
   * Wait until cart visible count equals expected with stability across consecutive reads.
   * Returns true on success, false on timeout.
   */
  private async waitForCountToEqual(expected: number, timeoutMs: number = 25000, requiredStableHits: number = 3): Promise<boolean> {
    await this.ensureCartPageReady();
    const start = Date.now();
    let stableHits = 0;
    while (Date.now() - start < timeoutMs) {
      try {
        const count = await this.getStableVisibleItemCount();
        if (count === expected) {
          stableHits++;
          if (stableHits >= requiredStableHits) return true;
        } else {
          stableHits = 0;
        }
      } catch {
        await this.ensureCartPageReady();
      }
      await this.sleep(150);
      await this.periodicRefreshCartIfDue(start);
    }
    return false;
  }

  /** Read current visible cart item count with a safe fallback. */
  private async getVisibleItemCount(): Promise<number> {
    if (this.page.isClosed()) return 0;
    try {
      const visibleCount = await this.visibleProductRows.count();
      if (visibleCount > 0) return visibleCount;
      return await this.productRows.count();
    } catch {
      return 0;
    }
  }

  /** Sample the visible item count several times and return when stable or the last read. */
  private async getStableVisibleItemCount(samples: number = 3, delayMs: number = 75): Promise<number> {
    if (this.page.isClosed()) return 0;
    let last = -1;
    let stableReads = 0;
    for (let i = 0; i < samples; i++) {
      const current = await this.getVisibleItemCount();
      if (current === last) {
        stableReads++;
      } else {
        last = current;
        stableReads = 1;
      }
      if (stableReads >= 2) return current; // at least two consistent reads
      await this.sleep(delayMs);
    }
    return last < 0 ? 0 : last;
  }

  /** Wait for either the cart table or the empty-cart message to be visible. */
  private async waitForCartReadySignals(timeoutMs: number = 12000): Promise<boolean> {
    const table = this.cartTable;
    const emptyMsg = this.emptyCartMessage;
    return await Promise.race([
      table.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => true).catch(() => false),
      emptyMsg.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => true).catch(() => false),
    ]);
  }

  /** Ensure we're on the cart page and DOM is ready for queries. */
  private async ensureCartPageReady(): Promise<void> {
    if (this.page.isClosed()) return; // Let caller handle if needed

    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (!/\/view_cart/i.test(this.page.url())) {
          await this.page.goto(paths.viewCart, { waitUntil: 'domcontentloaded' });
        }
      } catch {
        // Swallow transient navigation aborts and retry
      }

      try {
        await this.page.waitForLoadState('domcontentloaded');
      } catch {}

      const ok = await this.waitForCartReadySignals(8000);
      if (ok) return;

      // Brief pause before next attempt; if page closed, bail
      if (this.page.isClosed()) return;
      await this.page.waitForTimeout(150);
    }
  }

  @step('Wait for cart view to be ready')
  async waitForCartReady(): Promise<void> {
    await this.ensureCartPageReady();
  }

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

  @step('Assert cart has at least N items')
  async assertCartItemsCount(minExpected: number): Promise<void> {
    await this.ensureCartPageReady();
    let count: number;
    try {
      count = await this.visibleProductRows.count();
    } catch {
      await this.ensureCartPageReady();
      count = await this.visibleProductRows.count();
    }
    expect(count).toBeGreaterThanOrEqual(minExpected);
  }

  @step('Remove first cart item matching product name')
  async removeProductByName(nameFragment: string): Promise<void> {
    await this.ensureCartPageReady();
    const beforeCount = await this.getStableVisibleItemCount();
    const rows = this.cartItemRows;
    const nameRegex = new RegExp(this.escapeForRegex(nameFragment), 'i');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const nameCell = this.productNameCells.nth(i);
      if (await nameCell.count()) {
        const text = ((await nameCell.textContent()) || '').trim();
        if (nameRegex.test(text)) {
          const deleteLink = this.deleteButtons.nth(i).or(this.xDeleteLinks.nth(i));
          await deleteLink.first().click();
          await this.page.waitForLoadState('domcontentloaded');
          // Wait for the specific row to detach to ensure removal completed
          await row.waitFor({ state: 'detached' }).catch(() => {});
          // Wait until cart count decreases from beforeCount
          const start = Date.now();
          while (Date.now() - start < 5000) {
            const after = await this.getStableVisibleItemCount();
            if (after <= Math.max(0, beforeCount - 1)) break;
            await this.sleep(100);
          }
          return;
        }
      }
    }
    throw new Error(`Product not found in cart to remove: ${nameFragment}`);
  }

  @step('Remove all items from cart')
  async removeAllItems(): Promise<void> {
    await this.ensureCartPageReady();
    const emptyMsg = this.emptyCartMessage;

    // Fast path: empty state already visible
    if (await emptyMsg.isVisible().catch(() => false)) return;

    const maxIterations = 50;
    for (let i = 0; i < maxIterations; i++) {
      // If there are no product rows or no delete buttons, stop
      const rowsCount = await this.productRows.count().catch(() => 0);
      if (rowsCount === 0) break;

      const deleteBtn = this.deleteButtons.first().or(this.xDeleteLinks.first());
      if (!(await deleteBtn.count())) break;

      const row = this.productRows.first();
      // Try a normal click with force fallback
      try { await deleteBtn.click({ force: true }); } catch {}

      // Wait for the row to be removed and page to settle
      await row.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});

      // If empty message visible now, we are done
      if (await emptyMsg.isVisible().catch(() => false)) break;
    }

    // Final check
    const remaining = await this.getStableVisibleItemCount();
    if (remaining > 0 && !(await emptyMsg.isVisible().catch(() => false))) {
      throw new Error(`Cart not empty after removal. Remaining items: ${remaining}`);
    }
  }

  @step('Assert cart is empty')
  async assertCartEmpty(): Promise<void> {
    await this.ensureCartPageReady();
    const emptyMsg = this.emptyCartMessage;
    const timeoutMs = 15000;
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const [count, msgVisible] = await Promise.all([
        this.getStableVisibleItemCount(),
        emptyMsg.isVisible().catch(() => false),
      ]);
      if (msgVisible || count === 0) return;
      await this.sleep(150);
    }
    const remaining = await this.getStableVisibleItemCount();
    throw new Error(`Expected empty cart but found ${remaining} item(s).`);
  }

  @step('Assert cart has exactly N items')
  async assertCartItemsExactCount(expected: number): Promise<void> {
    if (expected === 0) {
      await this.assertCartEmpty();
      return;
    }
    await this.ensureCartPageReady();
    const ok = await this.waitForCountToEqual(expected, 15000, 3);
    if (ok) return;
    await this.ensureCartPageReady();
    const currentCount = await this.getStableVisibleItemCount();
    const names = await this.getVisibleProductNames();
    throw new Error(`Timed out waiting for cart to have ${expected} items. Got ${currentCount}. Items: ${names.join(', ')}`);
  }

  @step('Get cart items count')
  async getCartItemsCount(): Promise<number> {
    if (this.page.isClosed()) return 0;
    await this.ensureCartPageReady();
    try {
      return await this.visibleProductRows.count();
    } catch {
      if (this.page.isClosed()) return 0;
      await this.ensureCartPageReady();
      try {
        return await this.visibleProductRows.count();
      } catch {
        return 0;
      }
    }
  }

  @step((expected: number, timeoutMs: number = 5000) => `Wait until cart has exactly ${expected} items`)
  async waitForCartItemsExactCount(expected: number, timeoutMs: number = 20000): Promise<void> {
    const ok = await this.waitForCountToEqual(expected, timeoutMs, 3);
    if (ok) return;
    await this.ensureCartPageReady();
    const currentCount = await this.getStableVisibleItemCount();
    const names = await this.getVisibleProductNames();
    throw new Error(`Timed out waiting for cart to have ${expected} items. Got ${currentCount}. Items: ${names.join(', ')}`);
  }

  @step('Remove first item from cart')
  async removeFirstItem(): Promise<void> {
    await this.ensureCartPageReady();
    const before = await this.getStableVisibleItemCount();
    if (before === 0) return;
    const firstRow = this.productRows.first();
    const deleteBtn = this.deleteButtons.first().or(this.xDeleteLinks.first());
    if (!(await deleteBtn.count())) return;
    try {
      await deleteBtn.click({ force: true });
    } catch {}
    // Fallback to DOM click if needed
    try {
      const handle = await deleteBtn.elementHandle();
      if (handle) {
        await this.page.evaluate((el) => (el as HTMLElement).click(), handle).catch(() => {});
      }
    } catch {}
    await firstRow.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    await this.waitForCountToEqual(Math.max(0, before - 1), 5000, 2).catch(() => {});
  }

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
    const urlPromise = this.page.waitForURL(/\/(checkout|login|signup)\b/i, { timeout: timeoutMs }).then(() => true).catch(() => false);
    const headerPromise = this.loginOrSignupHeaderText.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => true).catch(() => false);
    const modalPromise = this.checkoutLoginModal.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => true).catch(() => false);
    const ctaPromise = this.registerLoginLink.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => true).catch(() => false);
    await Promise.race([urlPromise, headerPromise, modalPromise, ctaPromise]).catch(() => {});
    // Let network settle before next steps
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  @step('Place order with payment details')
  async placeOrder(
    params: { nameOnCard: string; cardNumber: string; cvc: string; expiryMonth: string; expiryYear: string; },
    _recovered: boolean = false,
  ): Promise<void> {
    if (this.page.isClosed()) {
      // Attempt a single recovery by switching to the last open page in the context
      if (!_recovered) {
        try {
          const replacement = await this.findPaymentOrCheckoutPage();
          if (replacement) {
            const fresh = new CartPage(replacement);
            return await fresh.placeOrder(params, true);
          }
        } catch {}
      }
      throw new Error('Cannot place order: page is already closed');
    }

    // Open payment form if a CTA is present; ignore if fields are already visible
    const placeOrderTrigger = this.placeOrderLink.or(this.placeOrderButton);
    let triggerCount = 0;
    try {
      triggerCount = await placeOrderTrigger.count();
    } catch {
      triggerCount = 0; // page could be navigating; continue to field-visibility check
    }
    if (triggerCount > 0) {
      try {
        await placeOrderTrigger.first().click({ force: true });
      } catch {}
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    }

    // If clicking caused a page replacement/closure, adopt the live page
    if (this.page.isClosed() && !_recovered) {
      const replacement = await this.findPaymentOrCheckoutPage();
      if (replacement) {
        const fresh = new CartPage(replacement);
        return await fresh.placeOrder(params, true);
      }
      throw new Error('Payment form not visible; original page closed and no replacement page found');
    }

    // Wait briefly for payment fields to appear
    const formVisible = await Promise.race([
      this.nameOnCardInput.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false),
      this.cardNumberInput.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false),
      this.payButton.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false),
    ]);

    if (!formVisible) {
      // One last attempt: scan all open pages for the form
      const alt = await this.findPaymentOrCheckoutPage();
      if (alt && alt !== this.page && !_recovered) {
        const fresh = new CartPage(alt);
        return await fresh.placeOrder(params, true);
      }
      const currentUrl = this.page.isClosed() ? '<closed>' : this.page.url();
      throw new Error(`Payment form not visible; cannot place order. URL=${currentUrl}`);
    }

    // Fill payment form using stable data-qa selectors with small retries (Firefox stability)
    const fillField = async (locator: Locator, value: string) => {
      const end = Date.now() + 4000;
      while (Date.now() < end) {
        try {
          await locator.fill(value);
          return;
        } catch {}
        await this.sleep(100);
      }
      await locator.fill(value); // final attempt to bubble proper error
    };
    await fillField(this.nameOnCardInput, params.nameOnCard);
    await fillField(this.cardNumberInput, params.cardNumber);
    await fillField(this.cvcInput, params.cvc);
    await fillField(this.expiryMonthInput, params.expiryMonth);
    await fillField(this.expiryYearInput, params.expiryYear);

    // Submit payment
    await this.payButton.click();

    // Assert success on current page only to avoid closed-page assertions
    await expect(this.page.getByText('Order Placed!', { exact: false })).toBeVisible();
  }

  @step('Assert checkout prompts for login')
  async assertCheckoutRequiresLogin(): Promise<void> {
    // Either redirect to auth, or show any clear login-required indicator
    const timeoutMs = 15000;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const url = this.page.url();
      const redirectedToAuth = /\/(login|signup)\b/i.test(url);
      if (redirectedToAuth) return;

      const [headerVisible, modalVisible, inlineMsgVisible, regLinkCount] = await Promise.all([
        this.loginOrSignupHeaderText.isVisible().catch(() => false),
        this.checkoutLoginModal.isVisible().catch(() => false),
        this.loginRequiredText.isVisible().catch(() => false),
        this.registerLoginLink.count().catch(() => 0),
      ]);

      if (headerVisible || modalVisible || inlineMsgVisible) return;

      const atCheckout = /\/checkout\b/i.test(url);
      if (atCheckout && regLinkCount > 0) return;

      await this.sleep(150);
    }
    const currentUrl = this.page.url();
    throw new Error(`Expected checkout to require login, but no prompt was detected. URL: ${currentUrl}`);
  }
}
