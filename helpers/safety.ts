import type { Locator } from '@playwright/test';

/** Sleep for a duration using a Promise. */
export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function a fixed number of times with a delay between attempts.
 * Throws the last error if all attempts fail.
 */
export async function retry<T>(fn: () => Promise<T>, attempts: number = 2, delayMs: number = 150): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleep(delayMs);
    }
  }
  throw lastErr as Error;
}

/**
 * Attempt to click a locator, falling back to DOM evaluate click on failure.
 * Errors are swallowed; use the return boolean to know if any click was attempted.
 */
export async function tryClickWithFallback(locator: Locator): Promise<boolean> {
  try {
    await locator.click({ force: true });
    return true;
  } catch {}
  try {
    const handle = await locator.elementHandle();
    if (handle) {
      await (handle as any).evaluate((el: HTMLElement) => el.click());
      return true;
    }
  } catch {}
  return false;
}


