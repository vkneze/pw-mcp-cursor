# How to View Allure Report from Artifacts

## ⚠️ Important: Don't Open index.html Directly!

Opening `index.html` directly in your browser (file:// protocol) will cause:
- Sections showing "Loading..." infinitely
- 404 errors on navigation
- CORS/security errors

## ✅ Correct Ways to View the Report:

### Option 1: Use Python HTTP Server (Easiest)

```bash
# 1. Extract the downloaded artifact
unzip allure-report.zip

# 2. Navigate to the folder
cd allure-report

# 3. Start HTTP server
python3 -m http.server 8080

# 4. Open in browser
open http://localhost:8080
```

### Option 2: Use npx serve

```bash
# 1. Extract and navigate
cd allure-report

# 2. Start server
npx serve .

# 3. Open the URL shown (usually http://localhost:3000)
```

### Option 3: View on GitHub Pages

If GitHub Pages is enabled, the report is automatically deployed to:
```
https://<username>.github.io/<repo-name>/
```

Enable GitHub Pages:
1. Go to repository **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / **root**
4. Save

## 🎯 Why This Happens

Allure reports use AJAX to load data dynamically. Modern browsers block these requests when using `file://` protocol for security reasons. An HTTP server is required.

