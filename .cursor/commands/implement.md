---
name: implement
description: "Implement the requested change following workspace rules and structure"
arguments:
  - name: goal
    description: "Short description of what to implement"
    type: string
    required: true
---

Implement the requested change adhering to these constraints:

- Generate TypeScript only.
- Follow Page Object Pattern and project structure (`tests/`, `pages/`, `data/`, `helpers/`).
- Use `@playwright/test` for imports.
- Add JSDoc blocks where required by rules.
- Keep data values out of tests/pages; put in `data/`.
- Prefer stable locators (ID, data-testid, role, text).
- Keep assertions reusable in `helpers/assertions.ts`.

Deliverables:
- The precise file edits only, ready to run, with no extra narrative.

Inputs:
- Selection (if any):
{{selection}}
- Goal:
{{goal}}

