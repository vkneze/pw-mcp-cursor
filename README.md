# Playwright Test Automation Practice

[![Playwright Tests](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/playwright.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/playwright.yml)
[![Nightly Tests](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/nightly.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/nightly.yml)

Automated end-to-end tests using Playwright with TypeScript and Page Object Model pattern.

## 🎯 Features

- ✅ Page Object Model (POM) architecture
- ✅ TypeScript for type safety
- ✅ Allure reporting with screenshots/videos
- ✅ GitHub Actions CI/CD
- ✅ Multi-browser testing (Chromium, Firefox, WebKit)
- ✅ Retry logic for flaky tests
- ✅ Custom fixtures for user management

## 📋 Prerequisites

- Node.js 18+
- npm or yarn

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all tests
npx playwright test
```

## 🧪 How to run tests

To run all tests locally: 
```npx playwright test```

To run specific test:
```npx playwright test homepage.spec.ts```

To run specific tests filtered by tag using grep: 
```npx playwright test --grep '@login'```

To run a test with a specific title, use the -g flag followed by the title of the test:
```npx playwright test -g "should load homepage successfully"```

To run last failed test:
```npx playwright test --last-failed```


## How to list tests

To list all tests:
```npx playwright test --list```

To list tests (without running them) filtered by tag using grep:
```npx playwright test --list --grep '@sanity'```


## 📊 How to open HTML report 
To open last HTML report run:
```npx playwright show-report```

## 📈 Allure Report

Generate and view Allure report locally:
```bash
# Generate report
npm run allure:generate

# Open report
npm run allure:open
```

## 🔄 GitHub Actions

Tests run automatically on:
- Push to `main`, `master`, or `develop` branches
- Pull requests
- Every night at 2 AM UTC (scheduled)
- Manual trigger from Actions tab

See [GitHub Actions Setup](.github/README.md) for detailed instructions.

## 🏗️ Project Structure

```
├── tests/              # Test specifications
├── pages/              # Page Object Models
├── actions/            # High-level action functions
├── helpers/            # Utility functions
├── data/               # Test data
├── fixtures/           # Custom Playwright fixtures
└── .github/workflows/  # GitHub Actions CI/CD
```

## 🔧 Configuration

- `playwright.config.ts` - Playwright configuration
- `.github/workflows/` - CI/CD workflows
- `allure-results/` - Test execution results (ignored in git)

## 📝 Writing Tests

Tests follow the Page Object Model pattern:

```typescript
test('example test', async ({ homePage, cartPage }) => {
  await homePage.goto();
  await homePage.addFirstNProductsToCart(2);
  await homePage.openCartFromHeader();
  
  const count = await cartPage.getCartItemsCount();
  expect(count).toBeGreaterThan(0);
});
```

## 🐛 Debugging

```bash
# Run in headed mode
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run specific browser
npx playwright test --project=chromium
```

## 📚 Learn More

- [Playwright Documentation](https://playwright.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Allure Report](https://docs.qameta.io/allure/)
- [GitHub Actions](https://docs.github.com/en/actions)
