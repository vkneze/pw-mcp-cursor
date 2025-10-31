import { test as base } from "@playwright/test";
import { BasePage } from "../pages/BasePage";
import { HomePage } from "../pages/HomePage";
import { ProductsPage } from "../pages/ProductsPage";
import { CartPage } from "../pages/CartPage";
import { AuthPage } from "../pages/AuthPage";
import type { RuntimeUser } from "../helpers/actions";
import { generateSignupUser } from "../data/auth";

/**
 * Extend Playwright's test with custom fixtures
 */
type PagesFixtures = {
  basePage: BasePage;
  homePage: HomePage;
  productsPage: ProductsPage;
  cartPage: CartPage;
  authPage: AuthPage;
};

type WorkerFixtures = {
  /** Worker index exposed for convenience in tests/utilities. */
  workerIndex: number;
  /** Unique suffix for generating IDs/emails per worker to avoid collisions. */
  uniqueWorkerSuffix: string;
};

type TestFixtures = {
  /** Unique suffix for generating IDs/emails per test to avoid collisions. */
  uniqueTestSuffix: string;
  /** Ephemeral user created for each test and deleted in afterEach. */
  ephemeralUser: RuntimeUser;
};

// Extend test with page fixtures (per-test) and worker-scoped utilities
export const test = base.extend<PagesFixtures & TestFixtures, WorkerFixtures>({
  basePage: async ({ page }, use) => {
    const base = new BasePage(page);
    await base.setupAdGuards();
    await use(base);
  },
  homePage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.setupAdGuards();
    await use(home);
  },
  productsPage: async ({ page }, use) => {
    const products = new ProductsPage(page);
    await products.setupAdGuards();
    await use(products);
  },
  cartPage: async ({ page }, use) => {
    const cart = new CartPage(page);
    await cart.setupAdGuards();
    await use(cart);
  },
  authPage: async ({ page }, use) => {
    const auth = new AuthPage(page);
    await auth.setupAdGuards();
    await use(auth);
  },
  uniqueTestSuffix: async ({}, use, testInfo) => {
    const suffix = `${testInfo.parallelIndex}-${testInfo.workerIndex}-${testInfo.project.name}-${testInfo.title.replace(/\W+/g, '-')}-${Date.now()}`;
    await use(suffix);
  },
  ephemeralUser: async ({ authPage }, use, testInfo) => {
    let user: RuntimeUser | null = null;
    
    try {
      // Create a unique user for this test
      const seed = `${testInfo.project.name}-${testInfo.title}-${Date.now()}`.replace(/\W+/g, '-');
      const signup = generateSignupUser(seed);
      await authPage.gotoSignup();
      await authPage.signupNewUser({
        name: signup.name,
        email: signup.email,
        password: signup.password,
        firstName: signup.firstName,
        lastName: signup.lastName,
        address1: signup.address1,
        country: signup.country,
        state: signup.state,
        city: signup.city,
        zipcode: signup.zipcode,
        mobile: signup.mobile,
      }, { autoContinue: true });

      user = { name: signup.name, email: signup.email, password: signup.password };
      await use(user);
    } catch (error) {
      // If setup failed, still call use with a dummy user to satisfy fixture contract
      if (!user) {
        await use({ name: '', email: '', password: '' });
      }
      throw error;
    } finally {
      // Cleanup: delete the account if it was created
      if (user && user.email) {
        try {
          await authPage.deleteAccount({ continueAfter: true });
        } catch {}
      }
    }
  },
  // Worker-scoped fixtures
  workerIndex: [
    async ({}, use) => {
      const index = Number(process.env.TEST_WORKER_INDEX ?? '0');
      await use(index);
    },
    { scope: 'worker' }
  ],
  uniqueWorkerSuffix: [
    async ({ workerIndex }, use) => {
      const suffix = `w${workerIndex}-${Date.now()}`;
      await use(suffix);
    },
    { scope: 'worker' }
  ],
});

// Export convenience types
export type { PagesFixtures };
export type { WorkerFixtures };
