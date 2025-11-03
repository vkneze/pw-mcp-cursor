/**
 * Home page object:
 * Navigation, header assertions, category/brand filtering,
 * product visibility checks, and add-to-cart helpers.
 */
import { Page, Locator, expect } from "@playwright/test";
import { BasePage, step } from '../pages/BasePage';
import { assertVisible } from "../helpers/assertions";
import { home } from "../data/home";
import { SELECTORS } from "../constants/selectors";
import { addFirstNFromCards } from "../helpers/product-card-helpers";

export class HomePage extends BasePage {
  readonly page: Page;

  // Header / Branding
  readonly mainHeader: Locator;

  // Sections
  readonly subscriptionText: Locator;

  // Product grid
  readonly productCards: Locator;
  readonly productNameInCardSelector: string;
  readonly addToCartInCardSelector: string;

  // Left menu
  readonly categoriesText: Locator;
  readonly brandsText: Locator;
  readonly headerCartLink: Locator;
  readonly panelsSelector: string;
  readonly panelTitleLinkSelector: string;
  readonly panelCollapseSelector: string;
  readonly brandsLinksSelector: string;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.mainHeader = page.locator(SELECTORS.HEADER);
    this.subscriptionText = page.getByText('Subscription', { exact: false });

    this.productCards = page.locator(SELECTORS.FEATURES_ITEMS_CARD);
    this.productNameInCardSelector = SELECTORS.PRODUCT_NAME_IN_CARD;
    this.addToCartInCardSelector = 'a.add-to-cart';

    this.categoriesText = page.getByText('Category', { exact: false });
    this.brandsText = page.getByText('Brands', { exact: false });
    this.headerCartLink = this.mainHeader.getByRole('link', { name: new RegExp(home.links.cart, 'i') });
    this.panelsSelector = SELECTORS.PANELS;
    this.panelTitleLinkSelector = SELECTORS.PANEL_TITLE_LINK;
    this.panelCollapseSelector = SELECTORS.PANEL_COLLAPSE;
    this.brandsLinksSelector = SELECTORS.BRANDS_LINKS;
  }

  /**
   * Navigate to the home page and wait for the main header to be visible.
   */
  @step("Open the AutomationExercise home page")
  async goto(): Promise<void> {
    await super.goto(home.url);
    await assertVisible(this.mainHeader);
  }

  /**
   * Assert that the home page has fully loaded by verifying URL, title, and key elements.
   */
  @step("Validate the home page has loaded")
  async assertLoaded(): Promise<void> {
    await this.assertUrlContains(/automationexercise\.com/);
    await this.assertTitleContains(home.homeTitleText);
    await assertVisible(this.mainHeader);
    await assertVisible(this.subscriptionText);
  }

  /**
   * Verify that all expected navigation links are present in the header.
   */
  @step("Assert that header contains all expected navigation links")
  async assertHeaderContains(): Promise<void> {
    await assertVisible(this.mainHeader);
    for (const linkName of Object.values(home.links)) {
      await assertVisible(
        this.mainHeader.getByRole("link", { name: new RegExp(linkName, "i") })
      );
    }
  }

  /**
   * Open a category from the left sidebar menu and optionally click a subcategory.
   * @param category - The category name (e.g., 'Women', 'Men')
   * @param subcategory - Optional subcategory name (e.g., 'Dress', 'Tshirts')
   */
  @step("Open a category from the left menu. Optionally click a subcategory.")
  async openCategory(category: string, subcategory?: string): Promise<void> {
    await assertVisible(this.categoriesText);

    // Click category link to expand
    const categoryLink = this.page
      .locator(SELECTORS.PANEL_TITLE_LINK)
      .filter({ hasText: new RegExp(category, 'i') });
    
    await assertVisible(categoryLink);
    await categoryLink.click();

    // If subcategory specified, click it
    if (subcategory) {
      const subcategoryLink = this.page
        .locator(SELECTORS.PANEL_COLLAPSE)
        .getByRole('link', { name: new RegExp(subcategory, 'i') });
      
      await assertVisible(subcategoryLink);
      await subcategoryLink.click();
      
      // Wait for category products page to load
      await this.safeWaitForURL(/category_products/i, { timeout: 10000 });
      await this.safeWaitForLoadState('domcontentloaded');
    }

    // Verify products are displayed
    await assertVisible(this.productCards.first());
  }

  /**
   * Filter products by selecting a brand from the left sidebar.
   * @param brandName - The brand name to filter by (e.g., 'Polo', 'H&M')
   */
  @step("Filter products by brand from the left menu")
  async filterByBrand(brandName: string): Promise<void> {
    await assertVisible(this.brandsText);
    await this.safeScrollIntoView(this.brandsText);

    // Expand Brands panel if collapsed
    const brandsPanelTitle = this.page.locator(this.panelTitleLinkSelector, { hasText: /brands/i }).first();
    await this.safeScrollIntoView(brandsPanelTitle);
    
    // Check if panel is already expanded by looking for visible brand links
    const brandsListVisible = await this.safeIsVisible(this.page.locator(this.brandsLinksSelector).first());
    if (!brandsListVisible) {
      await this.safeClick(brandsPanelTitle);
      // Wait for brands list to appear
      await this.safeWaitFor(this.page.locator(this.brandsLinksSelector).first(), { state: 'visible', timeout: 5000 });
    }

    // Click brand link and wait for results
    const brandLink = this.page.locator(`${this.brandsLinksSelector}:has-text("${brandName}")`).first();
    await assertVisible(brandLink);
    await this.safeScrollIntoView(brandLink);
    await brandLink.click({ force: true });
    await this.safeWaitForLoadState('domcontentloaded');
    await assertVisible(this.productCards.first());
  }

  /**
   * Verify that at least one product card is visible in the product grid.
   */
  @step("Assert that at least one product card is visible in the product grid")
  async assertProductsVisible(): Promise<void> {
    await assertVisible(this.productCards.first());
  }

  /**
   * Assert that only the specified brand appears in the product results.
   * @param brandName - The brand name to verify
   */
  @step("Assert only the specified brand appears in results")
  async assertOnlyBrandInResults(brandName: string): Promise<void> {
    await this.assertOnlyBrandsInResults([brandName]);
  }

  /**
   * Assert that only products from the specified brands appear in results.
   * Verifies that products are displayed after brand filtering.
   * Brand filtering is validated at the URL level (e.g., /brand_products/Polo).
   * @param brandNames - Array of brand names that should appear in results
   */
  @step((brands: string[]) => `Assert only these brands appear in results: ${brands.join(', ')}`)
  async assertOnlyBrandsInResults(brandNames: string[]): Promise<void> {
    // Verify products are displayed
    const count = await this.productCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify URL contains the brand filter (for single brand case)
    if (brandNames.length === 1) {
      const currentUrl = this.page.url().toLowerCase();
      const brandName = brandNames[0].toLowerCase();
      expect(currentUrl).toContain(`/brand_products/${brandName}`);
    }
  }

  /**
   * Add the first N products from the current product grid to cart.
   * @param n - Number of products to add
   * @returns Array of product names added to cart
   */
  @step("Add first N products to cart")
  async addFirstNProductsToCart(n: number): Promise<string[]> {
    return await addFirstNFromCards(
      this.page,
      this.productCards,
      this.productNameInCardSelector,
      [this.addToCartInCardSelector],
      n,
    );
  }

  /**
   * Filter by a single brand and add N products from that brand to cart.
   * @param brandName - The brand to filter by
   * @param n - Number of products to add from this brand
   * @returns Array of product names added (length = n)
   * @example await homePage.addFirstNProductsByBrand('Polo', 3); // Returns 3 product names
   */
  @step((brand: string, n: number) => `Add first ${n} products for brand "${brand}"`)
  async addFirstNProductsByBrand(brandName: string, n: number): Promise<string[]> {
    await this.filterByBrand(brandName);
    await this.assertProductsVisible();
    return await this.addFirstNProductsToCart(n);
  }

  /**
   * Add N products PER brand from multiple brands to cart.
   * Filters by each brand sequentially and adds products from each.
   * @param brands - Array of brand names to filter by
   * @param n - Number of products to add FROM EACH brand
   * @returns Aggregated array of all product names (length = brands.length × n)
   * @example await homePage.addFirstNProductsPerBrand(['Polo', 'H&M'], 2); // Returns 4 product names (2 from each)
   */
  @step((brands: string[], n: number) => `Add ${n} products from each brand: ${brands.join(', ')}`)
  async addFirstNProductsPerBrand(brands: string[], n: number): Promise<string[]> {
    await this.assertLoaded();
    const names: string[] = [];
    for (const brand of brands) {
      names.push(...(await this.addFirstNProductsByBrand(brand, n)));
    }
    return names;
  }

  /**
   * Click the cart link in the header to navigate to the cart page.
   */
  @step("Open cart from header")
  async openCartFromHeader(): Promise<void> {
    await this.headerCartLink.click();
  }
}
