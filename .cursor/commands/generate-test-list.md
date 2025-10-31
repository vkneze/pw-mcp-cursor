---
name: generate-test-list
description: "Scan all Playwright test files and generate TEST_CASES.md with a structured list of test suites and test cases including file paths."
---
Scan all `.ts` files in `/tests` folder. 

For each file:

1. Detect all `test.describe()` blocks and nested `test.describe()` blocks.  
2. Detect all `test()` calls within each describe block.  
3. Extract test names and maintain hierarchy:
   - Top-level `describe` > nested `describe` > `test`.
4. Capture the **relative file path** for each test case and put it in new line
5. Ignore commented-out or dynamically generated tests.  

Generate or update a Markdown file at the project root named `TEST_CASES.md` with this structure:

```markdown
# Test Cases

## <Describe Suite 1> (file: path/to/file1.ts)
- Test Case: <test name>
- Test Case: <test name>

## <Describe Suite 2> (file: path/to/file2.ts)
- Test Case: <test name>
  - Nested Test Case: <nested test>
