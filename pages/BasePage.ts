/**
 * Base page object: shared navigation, URL/title assertions,
 * and a `step` decorator to wrap page object methods in test.step logs.
 */
import { test, Page } from '@playwright/test';
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



