---
name: review-and-sugest-descriptions
description: "Review Playwright project files for missing or unclear JSDoc descriptions and suggest precise, scenario-focused summaries."
---

Review all Playwright project files and suggest descriptive JSDoc comments where they are missing or unclear.

Follow these rules carefully:

1. **Scope**
   - Apply to all `.ts`, `.mts`, `.js`, and `.mjs` files inside `/tests`, `/pages`, `/utils`, and root-level setup files.
   - Skip `node_modules`, `dist`, and generated or config files.
   - Do not remove or overwrite existing well-written JSDoc; only suggest additions or improvements.

2. **Purpose**
   - Ensure every Playwright test, helper function, and Page Object class has a clear and concise description.
   - Focus on meaningful summaries of *intent* and *behavior*, not implementation details or parameter types.
   - Keep all existing code and formatting unchanged — just suggest comments.

3. **Playwright Best Practices for Descriptions**
   - Test descriptions should clearly state the **user behavior or scenario**, not the technical action.
     - ✅ `Tests that a user can log in with valid credentials`
     - 🚫 `Clicks login button and waits for dashboard`
   - Page Object methods should describe their **purpose in the user flow**.
     - ✅ `Fills in login credentials and submits the form`
   - Utility functions should explain **why** they exist or how they support the tests.
     - ✅ `Generates unique email addresses for registration tests`

4. **Style Guidelines**
   - Use imperative, action-oriented phrasing (“Logs in user”, “Validates checkout flow”).
   - Limit to one or two sentences per description.
   - Use JSDoc format (`/** ... */`) directly above the relevant element.
   - Include `@fileoverview` at the top of each file summarizing its purpose, if missing.
     Example:
     ```ts
     /**
      * @fileoverview Contains Playwright tests for login and authentication flows.
      */
     ```

5. **Behavior**
   - Review existing JSDoc and keep it if it’s descriptive and aligned with best practices.
   - If missing or unclear, suggest a better summary comment without deleting existing code.
   - Only focus on comments; do not modify code, imports, or test names.

6. **Output**
   - Suggest new or improved JSDoc blocks inline.
   - Clearly mark new suggestions with `/** Suggested JSDoc */` so they can be reviewed before committing.
   - Preserve indentation and code style.
