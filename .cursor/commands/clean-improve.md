---
name: clean-improve
description: "Refactor selected code to be cleaner and more readable using project rules"
arguments:
  - name: notes
    description: "Optional extra guidance for how to refactor"
    type: string
    required: false
---

Refactor the selected code to be cleaner and more readable by following the rules defined in `.cursor/rules/workflows`.

Requirements:
- Improve naming, structure, and clarity.
- Apply TypeScript best practices and project conventions.
- Match existing formatting; avoid unrelated changes.

Return only the final edited code.

