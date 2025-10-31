import type { Page } from '@playwright/test';

export async function findPaymentOrCheckoutPage(context: Page['context']): Promise<Page | null> {
  try {
    const pages = context().pages().filter(p => !p.isClosed());
    for (let i = pages.length - 1; i >= 0; i--) {
      const p = pages[i];
      const url = p.url();
      if (/\/(checkout|payment)\b/i.test(url)) return p;
    }
    for (let i = pages.length - 1; i >= 0; i--) {
      const p = pages[i];
      const hasPayment = (await p.locator('[data-qa="pay-button"]').count().catch(() => 0)) > 0
        || (await p.locator('[data-qa="name-on-card"]').count().catch(() => 0)) > 0;
      if (hasPayment) return p;
      const hasPlaceOrder = (await p.getByRole('link', { name: /place order/i }).count().catch(() => 0)) > 0
        || (await p.getByRole('button', { name: /place order/i }).count().catch(() => 0)) > 0;
      if (hasPlaceOrder) return p;
    }
  } catch {}
  return null;
}


