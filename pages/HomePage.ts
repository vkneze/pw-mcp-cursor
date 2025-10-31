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
import { addFirstNFromCards } from "../helpers/cart-helpers";

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

    this.mainHeader = page.locator('#header');
    this.subscriptionText = page.getByText('Subscription', { exact: false });

    this.productCards = page.locator(SELECTORS.FEATURES_ITEMS_CARD);
    this.productNameInCardSelector = SELECTORS.PRODUCT_NAME_IN_CARD;
    this.addToCartInCardSelector = 'a.add-to-cart';

    this.categoriesText = page.getByText('Category', { exact: false });
    this.brandsText = page.getByText('Brands', { exact: false });
    this.headerCartLink = this.mainHeader.getByRole('link', { name: /Cart/i });
    this.panelsSelector = SELECTORS.PANELS;
    this.panelTitleLinkSelector = SELECTORS.PANEL_TITLE_LINK;
    this.panelCollapseSelector = SELECTORS.PANEL_COLLAPSE;
    this.brandsLinksSelector = SELECTORS.BRANDS_LINKS;
  }

  @step("Open the AutomationExercise home page")
  async goto(): Promise<void> {
    await super.goto(home.url);
    await assertVisible(this.mainHeader);
  }

  @step("Validate the home page has loaded")
  async assertLoaded(): Promise<void> {
    await this.assertUrlContains(/automationexercise\.com/);
    await this.assertTitleContains(home.homeTitleText);
    await assertVisible(this.mainHeader);
    await assertVisible(this.subscriptionText);
  }

  @step("Assert that header contains all expected navigation links")
  async assertHeaderContains(): Promise<void> {
    await assertVisible(this.mainHeader);
    const linkNames = [
      'Home', 'Products', 'Cart', 'Signup / Login', 'Test Cases',
      'API Testing', 'Video Tutorials', 'Contact us'
    ];
    for (const linkName of linkNames) {
      await assertVisible(
        this.mainHeader.getByRole("link", { name: new RegExp(linkName, "i") })
      );
    }
  }

  @step("Open a category from the left menu. Optionally click a child sub-category.")
  async openCategory(parentCategory: string, childCategory?: string): Promise<void> {
    await assertVisible(this.categoriesText);

    // Click parent category link to expand
    const parentLink = this.page
      .locator('.panel-title')
      .getByRole('link', { name: new RegExp(parentCategory, 'i') });
    
    await assertVisible(parentLink);
    await parentLink.click();

    // If child category specified, click it
    if (childCategory) {
      const childLink = this.page
        .locator('.panel-collapse')
        .getByRole('link', { name: new RegExp(childCategory, 'i') });
      
      await assertVisible(childLink);
      await childLink.click();
      
      // Wait for category products page to load
      await this.safeWaitForURL(/category_products/i, { timeout: 10000 });
      await this.safeWaitForLoadState('domcontentloaded');
    }

    // Verify products are displayed
    await assertVisible(this.productCards.first());
  }

  @step("Filter products by brand from the left menu")
  async filterByBrand(brandName: string): Promise<void> {
    await assertVisible(this.brandsText);
    await this.safeScrollIntoView(this.brandsText);

    // Expand Brands panel if collapsed
    const brandsPanel = this.page.locator(this.panelsSelector).filter({ has: this.page.locator(this.panelTitleLinkSelector, { hasText: /brands/i }) });
    const collapse = brandsPanel.locator(this.panelCollapseSelector).first();
    if (!(await this.safeIsVisible(collapse))) {
      const brandTitleLink = brandsPanel.locator(this.panelTitleLinkSelector, { hasText: /brands/i }).first();
      await this.safeClick(brandTitleLink);
      await this.safeWaitFor(collapse, { state: 'visible', timeout: 5000 });
    }

    // Click brand link and wait for results
    const brandLink = this.page.locator(`${this.brandsLinksSelector}:has-text("${brandName}")`).first();
    await assertVisible(brandLink);
    await this.safeScrollIntoView(brandLink);
    await brandLink.click({ force: true });
    await this.safeWaitForLoadState('domcontentloaded');
    await assertVisible(this.productCards.first());
  }

  @step("Assert that at least one product card is visible in the product grid")
  async assertProductsVisible(): Promise<void> {
    await assertVisible(this.productCards.first());
  }

  @step("Assert only the specified brand appears in results")
  async assertOnlyBrandInResults(brandName: string): Promise<void> {
    await this.assertOnlyBrandsInResults([brandName]);
  }

  @step((brands: string[]) => `Assert only these brands appear in results: ${brands.join(', ')}`)
  async assertOnlyBrandsInResults(brandNames: string[]): Promise<void> {
    const count = await this.productCards.count();
    expect(count).toBeGreaterThan(0);
    
    const alternation = brandNames.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const brandRegex = new RegExp(`Brand\\s*:\\s*(?:${alternation})`, 'i');

    const sample = Math.min(6, count);
    for (let i = 0; i < sample; i++) {
      const label = this.productCards.nth(i).getByText(/Brand\s*:/i).first();
      const visible = await this.safeIsVisible(label);
      if (!visible) continue;
      const text = ((await label.textContent().catch(() => '')) || '').trim();
      if (!brandRegex.test(text)) {
        throw new Error(`Unexpected brand for card #${i + 1}: "${text}" not in [${brandNames.join(', ')}]`);
      }
    }
  }

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
   * Filter by brand and add the first N products to cart, returning their names.
   */
  @step((brand: string, n: number) => `Add first ${n} products for brand "${brand}"`)
  async addFirstNProductsByBrand(brandName: string, n: number): Promise<string[]> {
    await this.filterByBrand(brandName);
    await this.assertProductsVisible();
    return await this.addFirstNProductsToCart(n);
  }

  @step("Open cart from header")
  async openCartFromHeader(): Promise<void> {
    await this.headerCartLink.click();
  }
}
