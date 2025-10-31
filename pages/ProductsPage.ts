/**
 * Products page object:
 * Supports opening the products page, searching products,
 * and asserting that only expected products are present in results.
 */
import { Page, Locator } from "@playwright/test";
import { BasePage, step } from "./BasePage";
import { products } from "../data/products";
import { assertVisible, assertGreaterThan } from "../helpers/assertions";
import { dismissAnyModalIfVisible } from "../helpers/modals";
import { addFirstNFromCards } from "../helpers/cart-helpers";
import { COMMON, PRODUCT, SEARCH as SEARCH_SEL } from "../helpers/selectors";

export class ProductsPage extends BasePage {
  readonly page: Page;

  // Header / Navigation
  readonly mainHeader: Locator;
  readonly productsHeader: Locator;

  // Search
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchedProductsHeader: Locator;

  // Product grid
  readonly productCards: Locator;
  readonly overlayAddInCardSelector: string;
  readonly infoAddInCardSelector: string;

  constructor(page: Page) {
    super(page);
    this.page = page;

    // Header / Navigation
    this.mainHeader = page.locator('#header');
    this.productsHeader = page.getByText('All Products', { exact: false });

    // Search with fallbacks
    this.searchInput = page.locator(SEARCH_SEL.INPUT).or(page.locator('input[name="search"]'));
    this.searchButton = page.locator(SEARCH_SEL.BUTTON).or(page.getByRole("button", { name: /Search/i }));
    this.searchedProductsHeader = page.getByText('Searched Products', { exact: false });

    // Product grid
    this.productCards = page.locator(COMMON.FEATURES_ITEMS_CARD);
    this.overlayAddInCardSelector = '.product-overlay a.add-to-cart, .overlay-content a.add-to-cart';
    this.infoAddInCardSelector = '.productinfo a.add-to-cart';
  }

  @step('Dismiss cart modal if visible')
  private async dismissCartModalIfVisible(): Promise<void> { await dismissAnyModalIfVisible(this.page); }

  @step("Open the AutomationExercise products page")
  async goto(): Promise<void> {
    await this.setupAdGuards();
    await super.goto(products.url);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await assertVisible(this.productsHeader);
  }

  @step("Execute a search using the products search box")
  async search(query: string): Promise<void> {
    await this.dismissCartModalIfVisible();
    await assertVisible(this.searchInput);
    await this.searchInput.fill(query);
    await this.dismissCartModalIfVisible();
    await assertVisible(this.searchButton);
    await this.searchButton.click();

    // Wait for results (either header or first product card)
    await Promise.race([
      this.searchedProductsHeader.waitFor({ state: 'visible', timeout: 7000 }),
      this.productCards.first().waitFor({ state: 'visible', timeout: 7000 }),
    ]).catch(() => {});
  }

  @step(
    "Assert that search results include only products whose names match the expected product name"
  )
  async assertResultsOnlyContain(expectedName: string): Promise<void> {
    const count = await this.productCards.count();
    if (count === 0) throw new Error(`No products found in search results`);

    const expectedNamePattern = new RegExp(this.escapeForRegex(expectedName), "i");
    for (let i = 0; i < count; i++) {
      const actualProductName = (await this.productCards.nth(i).locator(PRODUCT.NAME_IN_CARD).innerText()).trim();
      if (!expectedNamePattern.test(actualProductName)) {
        throw new Error(`Unexpected product in results: "${actualProductName}" does not match "${expectedName}"`);
      }
    }
  }

  @step("Add first N products to cart from products grid")
  async addFirstNProductsToCartFromProductsPage(n: number): Promise<string[]> {
    await this.setupAdGuards();
    return await addFirstNFromCards(
      this.page,
      this.productCards,
      PRODUCT.NAME_IN_CARD,
      [this.overlayAddInCardSelector, this.infoAddInCardSelector],
      n,
    );
  }
}
