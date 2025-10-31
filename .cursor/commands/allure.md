---
name: allure
description: "Generate and open Allure report from latest test results"
arguments:
  - name: port
    description: "Optional port to serve the report on (defaults to 9999)"
    type: number
    required: false
---

Generate and open the Allure report from the latest Playwright test results.

```bash
# Generate static report from results
npx allure generate test-results/allure-results --clean -o test-results/allure-report

# Serve the report locally (default port 9999)
npx allure open test-results/allure-report --port {{port}}
