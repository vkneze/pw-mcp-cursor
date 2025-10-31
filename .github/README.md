# GitHub Actions Setup

## 🚀 Workflows

### 1. **Playwright Tests** (`playwright.yml`)
- **Triggers**: Push/PR to `main`, `master`, or `develop` branches
- **What it does**:
  - Runs tests on all browsers (Chromium, Firefox, WebKit)
  - Uploads test results and Allure reports
  - Publishes Allure report to GitHub Pages
- **Manual trigger**: Go to Actions tab → Playwright Tests → Run workflow

### 2. **Nightly Tests** (`nightly.yml`)
- **Triggers**: Every night at 2 AM UTC (scheduled)
- **What it does**:
  - Runs all tests with 2 workers
  - Generates comprehensive Allure report
  - Notifies if tests fail
- **Manual trigger**: Go to Actions tab → Nightly Tests → Run workflow

## 📊 Viewing Results

### Test Reports
After workflow completes:
1. Go to **Actions** tab
2. Click on the workflow run
3. Scroll to **Artifacts** section
4. Download:
   - `playwright-report-{browser}` - HTML report for each browser
   - `allure-results-{browser}` - Allure results for each browser

### Allure Report (GitHub Pages)
If GitHub Pages is enabled:
1. Your repository → **Settings** → **Pages**
2. Source: Deploy from branch `gh-pages`
3. Report will be available at: `https://{username}.github.io/{repo-name}/`

## 🔧 Setup Required

### Enable GitHub Pages (for Allure reports)
1. Go to **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `gh-pages` / `root`
4. Click **Save**

### Repository Permissions
1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

## 🎯 Running Tests Manually

### Via GitHub UI
1. Go to **Actions** tab
2. Select workflow (Playwright Tests or Nightly Tests)
3. Click **Run workflow** button
4. Select branch
5. Click **Run workflow**

### Via GitHub CLI
```bash
# Run Playwright tests
gh workflow run playwright.yml

# Run nightly tests
gh workflow run nightly.yml
```

## 🔍 Debugging Failed Tests

1. **Check workflow logs**:
   - Actions tab → Click on failed run → Click on job → View logs

2. **Download artifacts**:
   - Scroll to Artifacts section
   - Download test results
   - View screenshots/videos of failures

3. **View Allure report**:
   - Open `allure-report/index.html` locally
   - Or view on GitHub Pages

## 📝 Customization

### Change test schedule
Edit `.github/workflows/nightly.yml`:
```yaml
schedule:
  - cron: '0 2 * * *'  # Change time/days here
```

### Add more browsers
Edit `.github/workflows/playwright.yml`:
```yaml
matrix:
  project: [chromium, firefox, webkit, 'Mobile Chrome']
```

### Change timeout
```yaml
timeout-minutes: 60  # Change this value
```

## 🐛 Troubleshooting

### Workflow not running
- Check if Actions are enabled: Settings → Actions → Allow all actions

### Allure report not publishing
- Verify GitHub Pages is enabled
- Check `gh-pages` branch exists
- Check workflow permissions are set correctly

### Tests failing in CI but passing locally
- Check Node.js version matches (set to 18)
- Verify dependencies are installed correctly
- Review environment differences (headless mode, etc.)

## 📚 Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [Allure Report](https://docs.qameta.io/allure/)

