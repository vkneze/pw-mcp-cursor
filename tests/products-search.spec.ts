import { test } from '../fixtures/pageFixtures';
import { products } from '../data/products';

/**
 * Products search tests: navigate to products page, search by specific product names,
 * and assert that only matching products appear in the results.
 * Reference: AutomationExercise Products page - https://automationexercise.com/products
 */
test.describe('Products search', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto(); // @step decorator logs this step
  });

  test('should return only "Blue Top" items when searching for "Blue Top"', async ({ productsPage }) => {
    const { query, expectedName } = products.sampleQueries.blueTop;

    await productsPage.search(query); // @step logs automatically
    await productsPage.assertResultsOnlyContain(expectedName); // @step logs automatically
  });

  test('should return only matching items across multiple searches', async ({ productsPage }) => {
    const cases = [
      products.sampleQueries.blueTop,
      products.sampleQueries.menTshirt,
      products.sampleQueries.stylishDress,
    ];

    for (const { query, expectedName } of cases) {
      await productsPage.search(query); // step logged via @step
      await productsPage.assertResultsOnlyContain(expectedName); // step logged via @step
    }
  });
});
