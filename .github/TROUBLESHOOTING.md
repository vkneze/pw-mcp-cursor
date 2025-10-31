# GitHub Actions Troubleshooting

## ⚠️ Common Issues

### "No files were found with the provided path"

**Problem:** Artifacts upload step warns that `playwright-report/` or `test-results/` don't exist.

**Causes:**
1. Tests failed before generating reports
2. Reporter not configured properly
3. Tests didn't run at all

**Solutions:**

#### ✅ Fixed in Latest Version
The workflows now:
- Check if files exist before uploading (`hashFiles()`)
- Use `if: !cancelled()` to run even if tests fail
- Split artifacts into separate uploads
- Add debug step to list generated files

#### Check Workflow Logs
Look for the "List generated files (debug)" step output to see what was actually created.

#### Verify Reporter Configuration
In `playwright.config.ts`:
```typescript
reporter: [
  ['list'],
  ['html', { open: 'never' }],  // ✅ Must be present
  ['allure-playwright'],         // ✅ Optional
],
```

#### Check Test Execution
- Look at "Run Playwright tests" step logs
- Verify tests actually ran (not skipped)
- Check for early failures (missing dependencies, syntax errors)

---

### Tests Pass Locally but Fail in CI

**Common causes:**

1. **Headless mode differences**
   - CI always runs in headless mode
   - Some UI interactions behave differently

2. **Timing issues**
   - CI runners may be slower
   - Network latency differences

3. **Missing dependencies**
   ```yaml
   - name: Install Playwright Browsers
     run: npx playwright install --with-deps  # ✅ --with-deps is important
   ```

4. **Environment variables**
   - Check if tests depend on local env vars
   - Add them to workflow secrets if needed

**Solutions:**
- Run locally with `CI=true npx playwright test --headed=false`
- Check screenshots/videos in artifacts
- Add more explicit waits for flaky tests

---

### Allure Report Not Generating

**Causes:**
1. No test results to process
2. Allure results directory empty or missing

**Solutions:**

#### Check if Allure reporter is configured:
```typescript
reporter: [
  ['allure-playwright'],  // ✅ Must be present
],
```

#### Manual verification:
```bash
# Locally
npx playwright test
ls -la allure-results/  # Should have *.json files

# Generate report manually
npm install -g allure-commandline
allure generate allure-results -o allure-report
```

---

### GitHub Pages Not Deploying

**Error 1:** `error: src refspec gh-pages does not match any`
- **Cause:** Allure report wasn't generated
- **Fix:** Added `force_orphan: true` to create branch on first deployment

**Error 2:** `remote: Permission denied to github-actions[bot]` (403 error)
- **Cause:** Workflow lacks permission to push to repository
- **Fix:** Added `permissions: contents: write` to workflow

**Root Causes:**
1. No Allure results to process (tests didn't generate them)
2. Allure reporter not configured
3. Artifacts download failed
4. Missing workflow permissions ⭐ Most common

**Fixed in Latest Version:**
- Workflow now checks if Allure results exist before deploying
- Merges results from all browser runs
- Verifies report was generated before pushing to gh-pages
- Gracefully skips deployment if nothing to deploy
- Uses `force_orphan: true` to create gh-pages on first run
- Includes proper permissions at workflow and job level

**Checklist:**

1. **✅ Workflow permissions are now included in the workflow file itself**
   - No manual configuration needed!
   - The workflow has `permissions: contents: write`

2. **Optional: Verify repository settings** (only if still failing)
   - Settings → Actions → General
   - Workflow permissions: **Read and write permissions** (should be default)
   - Or keep "Read repository contents" if you prefer job-level permissions

3. **Enable GitHub Pages**
   - Settings → Pages
   - Source: Deploy from branch `gh-pages`
   - Branch will be created automatically on first successful deployment

4. **Verify Allure reporter is configured**
   ```typescript
   // playwright.config.ts
   reporter: [
     ['allure-playwright'],  // ✅ Required
   ],
   ```

5. **Check workflow steps**
   - "Check if Allure results exist" → Should show "✅ Found Allure results"
   - "Generate Allure Report" → Should run without errors
   - "Debug - Check outputs" → Should show `has_results=true` and `has_report=true`
   - "Deploy report to GitHub Pages" → Only runs if previous checks pass

6. **Manual verification locally**
   ```bash
   npx playwright test
   ls -la allure-results/  # Should have *.json files
   ```

---

### Browser Installation Fails

**Error:** `browserType.launch: Executable doesn't exist`

**Solution:**
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps ${{ matrix.project }}
```

Or install all browsers:
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps
```

---

### Out of Memory / Timeout Issues

**Symptoms:**
- Tests hang
- Workflow times out
- "Page context closed" errors

**Solutions:**

#### Reduce parallelism:
```yaml
- name: Run Playwright tests
  run: npx playwright test --workers=1  # or --workers=2
```

#### Increase timeout:
```yaml
jobs:
  test:
    timeout-minutes: 90  # Increase from 60
```

#### In playwright.config.ts:
```typescript
timeout: 120 * 1000,  // 2 minutes per test
```

---

### Matrix Strategy Issues

**Problem:** All browsers fail with same error

**Check:**
```yaml
strategy:
  fail-fast: false  # ✅ Must be false to run all browsers
  matrix:
    project: [chromium, firefox, webkit]
```

**Debug specific browser:**
```yaml
# Temporarily test only one browser
matrix:
  project: [chromium]
```

---

## 🔍 Debugging Steps

### 1. Check Workflow Logs
Actions tab → Click run → Expand each step

### 2. Download Artifacts
Scroll to Artifacts section → Download reports

### 3. Run Locally with CI Settings
```bash
CI=true npx playwright test --headed=false --workers=2
```

### 4. Enable Debug Logging
```yaml
- name: Run Playwright tests
  run: DEBUG=pw:api npx playwright test
```

### 5. Add Custom Debug Steps
```yaml
- name: Debug Environment
  run: |
    node --version
    npm --version
    npx playwright --version
    pwd
    ls -la
```

---

## 📞 Getting Help

1. Check Playwright CI docs: https://playwright.dev/docs/ci
2. Review workflow logs carefully
3. Compare with successful runs
4. Check GitHub Actions status page

---

## ✅ Quick Verification Checklist

Before pushing:
- [ ] `playwright.config.ts` has `html` reporter
- [ ] `.gitignore` excludes test artifacts
- [ ] Workflow has `--with-deps` for browser installation
- [ ] Workflow has `CI: true` environment variable
- [ ] `continue-on-error: true` for test step
- [ ] Artifacts upload uses `if: !cancelled()`
- [ ] GitHub Pages enabled (if using Allure)
- [ ] Workflow permissions set to read/write

Test locally:
```bash
# Clean previous results
rm -rf test-results/ playwright-report/ allure-results/

# Run as CI would
CI=true npx playwright test --workers=2

# Verify artifacts exist
ls -la test-results/
ls -la playwright-report/
ls -la allure-results/
```

