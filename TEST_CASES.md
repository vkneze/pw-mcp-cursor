# Test Cases

## Auth - Signup (file: tests/auth-signup.spec.ts)
- Test Case: should create a new account successfully and delete it at the end
  - File: tests/auth-signup.spec.ts

## Cart flow - add products by brand (file: tests/cart-brand-flow.spec.ts)
- Test Case: (@flaky) should add products from Polo and H&M and verify in cart
  - File: tests/cart-brand-flow.spec.ts
- Test Case: should login, add brand-filtered products, and place order successfully
  - File: tests/cart-brand-flow.spec.ts

## Cart - search add 3, remove 1, expect 2 (@cart) (file: tests/cart-search-and-remove.spec.ts)
- Test Case: without login should add 3 via search, remove one, assert 2 remain
  - File: tests/cart-search-and-remove.spec.ts
- Test Case: should login, add two known products, verify, then empty cart
  - File: tests/cart-search-and-remove.spec.ts

## Home page (file: tests/homepage.spec.ts)
- Test Case: should load homepage successfully
  - File: tests/homepage.spec.ts
- Test Case: should display header navigation links
  - File: tests/homepage.spec.ts
- Test Case: should filter by category (Women → Dress)
  - File: tests/homepage.spec.ts
- Test Case: should filter by two brands and show only those results
  - File: tests/homepage.spec.ts

## Order - Existing user completes checkout (@order) (file: tests/order-existing-user.spec.ts)
- Test Case: should login, add two products from products page, and complete order successfully (@flaky)
  - File: tests/order-existing-user.spec.ts

## Products search (file: tests/products-search.spec.ts)
- Test Case: should return only "Blue Top" items when searching for "Blue Top"
  - File: tests/products-search.spec.ts
- Test Case: should return only matching items across multiple searches
  - File: tests/products-search.spec.ts
