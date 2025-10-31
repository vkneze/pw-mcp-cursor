import { test } from '@playwright/test';
import type { AuthPage } from '../pages/AuthPage';

export type RuntimeUser = { email: string; password: string; name?: string };

export async function login(authPage: AuthPage, user: RuntimeUser): Promise<void> {
  await test.step('Login: navigate to login page', async () => {
    await authPage.gotoLogin();
  });
  await test.step('Login: submit credentials', async () => {
    await authPage.loginExistingUser(user.email, user.password);
    // Log which user is logged in for this test/project
    try {
      const project = test.info().project.name;
      console.log(`[LOGIN] Project=${project} User=${user.email}`);
    } catch {}
    if (user.name) await authPage.assertLoggedInAs(user.name);
  });
}


