---
name: clean-locators
description: "Detect and refactor duplicate Playwright locators into reusable constants or helper methods"
arguments:
  - name: notes
    description: "Optional guidance on how to handle edge cases (e.g., ignore dynamic locators)"
    type: string
    required: false
---

Scan the selected file or code block for **duplicate Playwright locators** — such as repeated calls like:

```ts
page.locator('#cart_info_table')
page.getByRole('button', { name: /proceed to checkout/i })

// Example
// ❌ Before: locators used inline multiple times
await page.locator('#cart_info_table').isVisible();
await page.locator('#cart_info_table').screenshot();

await page.getByRole('button', { name: /proceed to checkout/i }).click();
await page.getByRole('button', { name: /proceed to checkout/i }).isEnabled();

// ✅ After: extracted into reusable, named locators
readonly cartTable = this.page.locator('#cart_info_table');
readonly checkoutButton = this.page.getByRole('button', { name: /proceed to checkout/i });

async verifyCartVisible() {
  await this.cartTable.isVisible();
}

async proceedToCheckout() {
  await this.checkoutButton.click();
}
