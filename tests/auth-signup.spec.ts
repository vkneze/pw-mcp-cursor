import { test } from '../fixtures/pageFixtures';
import { expect } from '@playwright/test';
import { generateSignupUser } from '../data/auth';

/**
 * Auth signup test: creates a unique account on AutomationExercise.
 * Fully isolated: no shared file writes; data is attached to test output.
 * The created account is deleted at the end to keep environment clean.
 */
test.describe('Auth - Signup', () => {
  test('should create a new account successfully and delete it at the end', async ({ authPage, uniqueTestSuffix }, testInfo) => {
    const user = generateSignupUser(uniqueTestSuffix);

    try {
      await authPage.gotoSignup();
      await authPage.signupNewUser(user);
      await authPage.assertLoggedInAs(user.name);

      // Expose creds via test annotations and attachments for per-test artifacting
      testInfo.annotations.push({ type: 'signedUpEmail', description: user.email });
      await testInfo.attach('signup-user.json', {
        contentType: 'application/json',
        body: JSON.stringify({ name: user.name, email: user.email, password: user.password }, null, 2),
      });
    } finally {
      // Ensure created account is deleted to keep environment clean
      await authPage.deleteAccount().catch(() => {});
    }
  });
});

