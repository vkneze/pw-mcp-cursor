---
name: remove-duplication
description: "Detect and suggest removal of duplicated code, showing proposed refactors first"
arguments:
  - name: context
    description: "Optional note or scope (e.g., component, test, or utils)"
    type: string
    required: false
---

Analyze the **selected code** for repeated logic, functions, or blocks that can be unified.

Steps:
1. Identify duplicated or similar code sections.
2. Suggest how to refactor them (e.g., extract helper, consolidate logic, or use parameters).
3. **Do not remove code yet** — only show the refactor suggestions and the new shared function signatures.
4. Wait for user confirmation before actually removing or merging duplicates.

Refactoring Guidelines:
- Preserve behavior and readability.
- Use project naming and TypeScript conventions.
- Keep side effects explicit.
- Respect `.cursor/rules/*` project guidelines if available.

Return a short summary + a proposed refactored snippet.
