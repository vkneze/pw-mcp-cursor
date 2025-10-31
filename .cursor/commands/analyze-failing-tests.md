---
name: analyze-failing-tests
description: "Analyze failing Playwright tests and suggest fixes inline, following existing project rules and Playwright best practices."
---
Review the selected Playwright test file or folder for failing tests. For each failure:

- Follow existing project conventions and Playwright best practices.
- Suggest fixes for failing assertions, timing issues, or fixture misuse.
- Provide explanations for each suggestion.
- Output suggestions inline as comments using /** Suggested Fix */.
- Keep all original code intact; do not overwrite without review.
