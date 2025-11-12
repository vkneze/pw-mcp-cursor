# Playwright Test Automation Practice

[![Playwright Tests](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/playwright.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/playwright.yml)
[![Nightly Tests](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/nightly.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/nightly.yml)

E2E tests using Playwright with TypeScript, Page Object Model, and Allure reporting.

## 🎯 Features

- ✅ Page Object Model architecture
- ✅ TypeScript for type safety
- ✅ Allure reporting with history/trends
- ✅ GitHub Actions CI/CD with browser caching
- ✅ Cross-browser testing (Chromium, Firefox, WebKit)
- ✅ Retry logic for flaky tests
- ✅ Custom fixtures for test isolation

## 📋 Installation

```bash
npm ci                      # Install dependencies
npx playwright install      # Install browsers
```

## 🧪 Running Tests

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test homepage.spec.ts

# Run by tag
npx playwright test --grep '@smoke'

# Run by title
npx playwright test -g "should login successfully"

# Run last failed
npx playwright test --last-failed

# Run headed/debug mode
npx playwright test --headed
npx playwright test --debug

# Run specific browser
npx playwright test --project=chromium
```

## 📋 Listing Tests

```bash
npx playwright test --list                # All tests
npx playwright test --list --grep '@smoke' # Filtered by tag
```

## 📊 Reports

### Playwright HTML Report
```bash
npx playwright show-report
```

### Allure Report

**🌐 Recommended: View on GitHub Pages**

Reports are automatically deployed after each CI run:
- **URL:** `https://<username>.github.io/<repo>/`
- **Setup:** Repo Settings → Pages → Source: **gh-pages** branch
- **Benefits:** Always up-to-date, includes trends, no local setup

**Local Generation:**

```bash
npm run allure:serve              # Generate and open (auto-starts server)
npm run allure:generate           # Generate only
npm run allure:open               # Open existing report
npm run allure:clean              # Clean old reports
```

**📊 Trends:** Run tests 2-3+ times to see trend graphs (duration, retries, history).

> **Note:** If downloading artifacts from GitHub Actions, don't open `index.html` directly. Serve via HTTP: `cd allure-report && npx -y serve -p 8080 .` → http://localhost:8080

## 🔄 GitHub Actions

Tests run automatically on:
- Push to `main`, `feature/**`, `fix/**` branches
- Pull requests to `main`
- Manual trigger

**Browser caching enabled** - first run slow, subsequent runs ~60s faster per browser.

## 🏗️ Project Structure

```
├── tests/              # Test specs
├── pages/              # Page Objects
├── actions/            # Reusable actions
├── helpers/            # Utilities
├── data/               # Test data
├── constants/          # Selectors, configs
├── fixtures/           # Custom fixtures
├── .cursor/            # Cursor AI rules & commands
│   ├── rules/          # Workspace rules
│   └── commands/       # Custom commands
└── .github/            # GitHub configuration
    └── workflows/      # CI/CD workflows
```

## 📝 Writing Tests

```typescript
test('example', async ({ homePage, cartPage }) => {
  await homePage.goto();
  await homePage.addFirstNProductsToCart(2);
  await cartPage.assertCartItemsExactCount(2);
});
```

## 🔧 Version Management

```bash
# Check version
npx playwright --version
npm ls @playwright/test

# Upgrade
npm install playwright@latest
npm install playwright@1.50.1    # Specific version

# Fix multiple versions
rm -rf node_modules package-lock.json
npm install
```

**Important:** Update `.github/workflows/playwright.yml` to match Playwright version.

## 🧪 Testing & Linting

```bash
npx tsc -p tsconfig.json         # Check TypeScript
npx eslint .                     # Lint
npx eslint . --fix               # Lint and fix
```

## 💡 Best Practices

- Tag tests: `@smoke`, `@sanity`, `@flaky`
- Use `.fixme()` for failing tests with annotations
- Keep locators in page constructors
- Centralize test data in `data/`
- Follow Arrange → Act → Assert pattern

## 📚 Documentation

- [Playwright Docs](https://playwright.dev)
- [Allure Report](https://allurereport.org/docs/playwright/)
- [Browser Caching Guide](.github/BROWSER_CACHING.md)
- [TypeScript](https://typescriptlang.org)
