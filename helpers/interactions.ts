import type { Locator } from '@playwright/test';

export async function clickFirstAvailable(
  candidates: Locator[],
  options?: { force?: boolean; timeoutMs?: number }
): Promise<Locator | null> {
  const force = options?.force ?? true;
  const deadline = Date.now() + (options?.timeoutMs ?? 3000);
  while (Date.now() < deadline) {
    for (const cand of candidates) {
      try {
        if (await cand.count()) {
          await cand.first().click({ force });
          return cand;
        }
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

export async function fillWithRetries(
  locator: Locator,
  value: string,
  timeoutMs: number = 4000,
  stepMs: number = 100,
): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      await locator.fill(value);
      return;
    } catch {}
    await new Promise((r) => setTimeout(r, stepMs));
  }
  await locator.fill(value);
}


