/**
 * Base page object: shared navigation, URL/title assertions,
 * and a `step` decorator to wrap page object methods in test.step logs.
 */
import { test, Page, Locator } from '@playwright/test';
import { assertTitleContains, assertUrlContains } from '../helpers/assertions';
import { escapeForRegex } from '../utils/strings';

export class BasePage {
  readonly page: Page;
  private adGuardsConfigured: boolean = false;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a path relative to baseURL.
   * @param path Relative path to open, defaults to '/'.
   */
  async goto(path: string = '/'): Promise<void> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 });
        return;
      } catch (err) {
        lastError = err;
        // Soft reset navigation context between attempts
        await this.page.waitForTimeout(300).catch(() => {
          // Timeout may fail if page is closed - ignore
        });
        if (!/^\/?$/.test(path)) {
          await this.page.goto('/', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {
            // Fallback navigation may fail - will retry in next iteration
          });
        }
      }
    }
    throw lastError as Error;
  }

  /**
   * Assert the current URL matches or contains the provided value.
   * @param value String or RegExp to match against URL.
   */
  async assertUrlContains(value: string | RegExp): Promise<void> {
    await assertUrlContains(this.page, value);
  }

  /**
   * Assert the page title matches or contains the provided value.
   * @param value String or RegExp to match against title.
   */
  async assertTitleContains(value: string | RegExp): Promise<void> {
    await assertTitleContains(this.page, value);
  }

  /**
   * Escape a string for safe use in RegExp constructors.
   * Used by child page classes for building search patterns.
   */
  protected escapeForRegex(value: string): string {
    return escapeForRegex(value);
  }

  /**
   * Best-effort mitigation for ad/banner overlays intercepting clicks.
   * Disables pointer events for common ad containers and iframes.
   */
  async disableBannerInterception(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        iframe[id*="google_ads"], iframe[src*="ads"],
        #aswift_0, [id^="google_ads_iframe"], .advertisement,
        ins.adsbygoogle, .adsbygoogle, .google-auto-placed {
          pointer-events: none !important;
          user-select: none !important;
        }
        ins.adsbygoogle, .adsbygoogle, .google-auto-placed {
          display: none !important;
          visibility: hidden !important;
        }
      `,
    }).catch((err) => {
      console.log('[INFO] Could not inject ad-blocking styles:', err.message);
    });
  }

  /** Configure network-level and CSS-level ad protections once per page. */
  async setupAdGuards(): Promise<void> {
    if (!this.adGuardsConfigured) {
      this.adGuardsConfigured = true;
      
      // Setup network-level ad blocking
      const adDomains = [
        'googlesyndication.com',
        'doubleclick.net',
        'adservice.google.com',
        'googleads.g.doubleclick.net',
        'adnxs.com',
        'taboola.com',
        'outbrain.com',
      ];
      
      await this.page.route('**/*', (route) => {
        const url = route.request().url();
        try {
          const host = new URL(url).hostname;
          if (adDomains.some((d) => host.includes(d))) {
            return route.abort().catch(() => route.continue());
          }
        } catch (err) {
          // Invalid URL, just continue
        }
        return route.continue();
      }).catch((err) => {
        console.log('[INFO] Could not setup network ad blocking:', err.message);
      });

      // Re-apply CSS guards after each DOM content loaded
      this.page.on('domcontentloaded', async () => {
        await this.disableBannerInterception();
      });
    }
    await this.disableBannerInterception();
  }

  /**
   * Safely wait for a locator to reach a certain state.
   * Returns true if wait succeeded, false if timeout or error.
   */
  protected async safeWaitFor(locator: Locator, options?: { state?: 'visible' | 'attached' | 'detached' | 'hidden'; timeout?: number }): Promise<boolean> {
    return await locator.waitFor(options).then(() => true).catch((err) => {
      // Timeout or element not found is expected in safe operations
      return false;
    });
  }

  /**
   * Safely attempt a click action.
   * Returns true if click succeeded, false if error.
   */
  protected async safeClick(locator: Locator, options?: { force?: boolean; timeout?: number }): Promise<boolean> {
    return await locator.click(options).then(() => true).catch((err) => {
      // Click failure is expected - element might be detached or not clickable
      return false;
    });
  }

  /**
   * Safely attempt a fill action.
   * Returns true if fill succeeded, false if error.
   */
  protected async safeFill(locator: Locator, value: string): Promise<boolean> {
    return await locator.fill(value).then(() => true).catch((err) => {
      // Fill failure is expected - element might not be ready or visible
      return false;
    });
  }

  /**
   * Safely check if a locator is visible.
   * Returns true if visible, false if not visible or error.
   */
  protected async safeIsVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible().catch((err) => {
      // Element not visible or page closed is expected
      return false;
    });
  }

  /**
   * Safely get the count of matching elements.
   * Returns count if successful, 0 if error.
   */
  protected async safeCount(locator: Locator): Promise<number> {
    return await locator.count().catch((err) => {
      // Count failure is expected - page might be closed or navigating
      return 0;
    });
  }

  /**
   * Wait for page load state without throwing on timeout.
   * Used for "fire-and-forget" wait operations where timeout is acceptable.
   */
  protected async safeWaitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load'): Promise<void> {
    await this.page.waitForLoadState(state).catch((err) => {
      // Timeout is acceptable - page might already be in desired state or closed
    });
  }

  /**
   * Safely wait for URL to match a pattern.
   * Returns true if URL matched, false if timeout or error.
   */
  protected async safeWaitForURL(url: string | RegExp | ((url: URL) => boolean), options?: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' }): Promise<boolean> {
    return await this.page.waitForURL(url, options).then(() => true).catch((err) => {
      // Timeout or navigation failure is expected in safe operations
      return false;
    });
  }

  /**
   * Safely scroll element into view if needed.
   * Returns true if scroll succeeded, false if error.
   */
  protected async safeScrollIntoView(locator: Locator, options?: { timeout?: number }): Promise<boolean> {
    return await locator.scrollIntoViewIfNeeded(options).then(() => true).catch((err) => {
      // Scroll failure is expected - element might not be scrollable or detached
      return false;
    });
  }
}

/**
 * Decorator function for wrapping POM methods in a test.step.
 *
 * Use it without a step name `@step()`.
 *
 * Or with a step name `@step("Search something")`.
 *
 * @param stepName - The name of the test step.
 * @returns A decorator function that can be used to decorate test methods.
 */
export function step(stepName?: string | ((...args: any[]) => string)) {
  return function decorator(target: Function, context: any) {
    return async function replacementMethod(this: any, ...args: any[]) {
      const resolvedName =
        typeof stepName === 'function'
          ? stepName(...args)
          : stepName || String(context.name);

      // Just the step name, no class name
      const name = resolvedName;

      return await test.step(name, async () => {
        console.log(`STEP: ${name}`);
        return await target.call(this, ...args);
      });
    };
  };
}



