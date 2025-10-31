import { test } from '../fixtures/pageFixtures';
import { filters } from '../data/filters';

/**
 * Home page tests: fully parallel-safe.
 * Each test gets a fresh page and context, starts from the homepage,
 * and has no dependency on other tests.
 */
test.describe("Home page", () => {
  // @flaky: Brand detail navigation can occasionally close/redirect unexpectedly on the demo site.
  test.describe.configure({ retries: 1 });
  // Ensure each test starts from a clean homepage
  test.beforeEach(async ({ homePage }) => {
    // Navigate to home and reset any filters/state
    await homePage.goto();

    // Optional: clear cookies/localStorage to avoid state leakage
    await homePage.page.context().clearCookies();
    await homePage.page.evaluate(() => localStorage.clear());
  });

  test("should load homepage successfully", async ({ homePage }) => {
    await homePage.assertLoaded();
  });

  test("should display header navigation links", async ({ homePage }) => {
    await homePage.assertHeaderContains();
  });

  test("should filter by category (Women → Dress)", async ({ homePage }) => {
    await homePage.openCategory(
      filters.categoryWomenDress.category,
      filters.categoryWomenDress.subCategoryDress
    );
    await homePage.assertProductsVisible();
  });

  test("should filter by two brands and show only those results", async ({ homePage }) => {
    // Verify Polo brand filter results
    await homePage.filterByBrand(filters.brandPolo.name);
    await homePage.assertProductsVisible();
    await homePage.assertOnlyBrandInResults(filters.brandPolo.name);

    // Then switch to H&M brand filter and verify
    await homePage.filterByBrand(filters.brandHM.name);
    await homePage.assertProductsVisible();
    await homePage.assertOnlyBrandInResults(filters.brandHM.name);
  });
});
