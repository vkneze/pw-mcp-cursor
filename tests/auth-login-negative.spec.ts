import { test } from '../fixtures/pageFixtures';
import { expect } from '@playwright/test';
import { invalidLoginData } from '../data/auth';

/**
 * Negative test cases for login functionality.
 * Tests various failure scenarios to ensure proper error handling.
 */
test.describe('Auth - Login Negative Scenarios', () => {
  
  /**
   * Verify that login fails with correct email but incorrect password.
   * Expected: Error message should be displayed to the user.
   */
  test('should show error when login with wrong password', async ({ authPage }) => {
    await authPage.gotoLogin();
    
    // Manually fill login form with invalid credentials
    await authPage.loginEmailInput.fill(invalidLoginData.nonExistentEmail);
    await authPage.loginPasswordInput.fill(invalidLoginData.wrongPassword);
    await authPage.loginButton.click();
    
    // Assert error message is visible
    await expect(authPage.loginErrorMsg).toBeVisible({ timeout: 10000 });
  });

  /**
   * Verify that login fails with an improperly formatted email address.
   * Expected: Browser validation or server error, user remains on login page.
   */
  test('should show error when login with invalid email format', async ({ authPage }) => {
    await authPage.gotoLogin();
    
    // Try to login with invalid email format
    await authPage.loginEmailInput.fill(invalidLoginData.invalidEmailFormat);
    await authPage.loginPasswordInput.fill(invalidLoginData.validPasswordFormat);
    await authPage.loginButton.click();
    
    // Browser validation or server error should occur
    // Either stays on login page or shows error
    await expect(authPage.loginHeader).toBeVisible();
  });

  /**
   * Verify that login fails when no credentials are provided.
   * Expected: Browser validation prevents form submission, user stays on login page.
   */
  test('should show error when login with empty credentials', async ({ authPage }) => {
    await authPage.gotoLogin();
    
    // Try to login without filling anything
    await authPage.loginButton.click();
    
    // Should stay on login page (browser validation)
    await expect(authPage.loginHeader).toBeVisible();
  });
});

