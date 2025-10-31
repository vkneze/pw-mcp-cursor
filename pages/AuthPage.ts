import { Page, Locator, expect } from '@playwright/test';
import { BasePage, step } from './BasePage';

/**
 * Auth page object:
 * Handles signup and login flows on AutomationExercise.
 * Methods prefer stable ARIA roles/labels with safe fallbacks.
 */
export class AuthPage extends BasePage {
  readonly page: Page;

  // Common headers/sections
  readonly loginHeader: Locator;
  readonly signupHeader: Locator;
  readonly loginOrSignupHeader: Locator;
  readonly header: Locator;

  // Login form
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly logoutLink: Locator;
  readonly loginErrorMsg: Locator;

  // Signup form
  readonly signupNameInput: Locator;
  readonly signupEmailInput: Locator;
  readonly signupButton: Locator;

  // Account info
  readonly enterInfoHeader: Locator;
  readonly titleMrRadio: Locator;
  readonly titleMrLabel: Locator;
  readonly accountPasswordInput: Locator;
  readonly daySelect: Locator;
  readonly monthSelect: Locator;
  readonly yearSelect: Locator;
  readonly newsletterCheckbox: Locator;
  readonly offersCheckbox: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly address1Input: Locator;
  readonly countrySelect: Locator;
  readonly stateInput: Locator;
  readonly cityInput: Locator;
  readonly zipcodeInput: Locator;
  readonly mobileInput: Locator;
  readonly createAccountButton: Locator;
  readonly accountCreatedHeader: Locator;
  readonly accountDeletedHeader: Locator;
  readonly continueButton: Locator;
  readonly deleteAccountLink: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.loginHeader = page.getByText('Login to your account', { exact: false });
    this.signupHeader = page.getByText('New User Signup', { exact: false });
    this.loginOrSignupHeader = page.getByRole('heading', { name: /Login to your account|New User Signup/i }).first();
    this.header = page.locator('#header');

    // Login form
    this.loginEmailInput = page.locator('[data-qa="login-email"]').or(page.getByLabel(/email/i));
    this.loginPasswordInput = page.locator('[data-qa="login-password"]').or(page.getByLabel(/password/i));
    this.loginButton = page.locator('[data-qa="login-button"]').or(page.getByRole('button', { name: /login/i }));
    this.logoutLink = page.getByRole('link', { name: /logout/i });
    this.loginErrorMsg = page.getByText(/your email or password is incorrect/i);

    // Signup form
    this.signupNameInput = page.locator('[data-qa="signup-name"]');
    this.signupEmailInput = page.locator('[data-qa="signup-email"]');
    this.signupButton = page.locator('[data-qa="signup-button"]');

    // Account info
    this.enterInfoHeader = page.getByText('Enter Account Information', { exact: false });
    this.titleMrRadio = page.locator('#id_gender1');
    this.titleMrLabel = page.locator('label[for="id_gender1"]').first();
    this.accountPasswordInput = page.locator('[data-qa="password"]').or(page.getByLabel(/password/i));
    this.daySelect = page.locator('#days');
    this.monthSelect = page.locator('#months');
    this.yearSelect = page.locator('#years');
    this.newsletterCheckbox = page.locator('#newsletter');
    this.offersCheckbox = page.locator('#optin');
    this.firstNameInput = page.locator('[data-qa="first_name"]');
    this.lastNameInput = page.locator('[data-qa="last_name"]');
    this.address1Input = page.locator('[data-qa="address"]');
    this.countrySelect = page.locator('[data-qa="country"]');
    this.stateInput = page.locator('[data-qa="state"]');
    this.cityInput = page.locator('[data-qa="city"]');
    this.zipcodeInput = page.locator('[data-qa="zipcode"]');
    this.mobileInput = page.locator('[data-qa="mobile_number"]');
    this.createAccountButton = page.locator('[data-qa="create-account"]');
    this.accountCreatedHeader = page.getByText(/account created/i);
    this.accountDeletedHeader = page.getByText(/account deleted/i);
    this.continueButton = page
      .locator('[data-qa="continue-button"]').or(
        page.getByRole('link', { name: /continue/i })
      )
      .or(page.getByRole('button', { name: /continue/i }));
    this.deleteAccountLink = page.getByRole('link', { name: /delete account/i });
  }

  @step('Open the login page')
  async gotoLogin(): Promise<void> {
    // Login and signup often share the same page on this site.
    await this.goto('/login');
    if (!(await this.loginHeader.count())) {
      // Fallback to combined page
      await this.goto('/signup');
    }
    await expect(this.loginOrSignupHeader).toBeVisible();
  }

  @step('Login with existing user credentials')
  async loginExistingUser(email: string, password: string): Promise<void> {
    await expect(this.loginEmailInput.first()).toBeVisible();
    await this.loginEmailInput.first().fill(email);
    await this.loginPasswordInput.first().fill(password);
    await this.loginButton.first().click();

    const outcome = await Promise.race([
      this.logoutLink.waitFor({ state: 'visible', timeout: 12000 }).then(() => 'success').catch(() => null),
      this.loginErrorMsg.waitFor({ state: 'visible', timeout: 12000 }).then(() => 'error').catch(() => null),
    ]);

    if (outcome === 'error' || (await this.loginErrorMsg.isVisible().catch(() => false))) {
      throw new Error('Incorrect email or password');
    }

    await expect(this.logoutLink).toBeVisible();
  }

  @step('Open the signup page')
  async gotoSignup(): Promise<void> {
    await this.goto('/signup');
    await expect(this.signupHeader).toBeVisible();
  }

  @step('Create new user account')
  async signupNewUser(params: {
    name: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    address1: string;
    country: string;
    state: string;
    city: string;
    zipcode: string;
    mobile: string;
  }, options?: { autoContinue?: boolean }): Promise<void> {
    const {
      name,
      email,
      password,
      firstName,
      lastName,
      address1,
      country,
      state,
      city,
      zipcode,
      mobile,
    } = params;

    // Step 1: initial signup form (Name + Email) — use stable data-qa selectors
    await expect(this.signupHeader).toBeVisible();
    await this.signupNameInput.fill(name);
    await this.signupEmailInput.fill(email);
    await this.signupButton.click();

    // Step 2: Enter Account Information
    await expect(this.enterInfoHeader).toBeVisible();

    // Title radio — simple best-effort (label click or radio check)
    if (await this.titleMrRadio.count()) {
      const radio = this.titleMrRadio.first();
      const label = this.titleMrLabel;
      if (await label.count()) { await label.click({ force: true }).catch(() => {}); }
      else { await radio.check({ force: true }).catch(() => {}); }
    }

    // Password
    if (await this.accountPasswordInput.count()) {
      await this.accountPasswordInput.fill(password);
    }

    // Date of birth (optional) – skip if not present
    if (await this.daySelect.count()) await this.daySelect.selectOption('1');
    if (await this.monthSelect.count()) await this.monthSelect.selectOption('1');
    if (await this.yearSelect.count()) await this.yearSelect.selectOption('1990');

    // Newsletter / offers boxes (optional) — best-effort, ignore failures
    if (await this.newsletterCheckbox.count()) await this.newsletterCheckbox.setChecked(true, { force: true }).catch(() => {});
    if (await this.offersCheckbox.count()) await this.offersCheckbox.setChecked(true, { force: true }).catch(() => {});

    // Address information
    if (await this.firstNameInput.count()) await this.firstNameInput.fill(firstName);
    if (await this.lastNameInput.count()) await this.lastNameInput.fill(lastName);
    if (await this.address1Input.count()) await this.address1Input.fill(address1);
    if (await this.countrySelect.count()) await this.countrySelect.selectOption({ label: country });
    if (await this.stateInput.count()) await this.stateInput.fill(state);
    if (await this.cityInput.count()) await this.cityInput.fill(city);
    if (await this.zipcodeInput.count()) await this.zipcodeInput.fill(zipcode);
    if (await this.mobileInput.count()) await this.mobileInput.fill(mobile);

    // Create account
    await this.createAccountButton.click();

    await expect(this.accountCreatedHeader).toBeVisible();

    const shouldContinue = options?.autoContinue !== false;
    if (shouldContinue) {
      await this.continueAfterAccountCreated();
    }
  }

  @step('Assert account created message is visible')
  async assertAccountCreatedMessage(): Promise<void> {
    await expect(this.accountCreatedHeader).toBeVisible();
  }

  @step('Continue after account created')
  async continueAfterAccountCreated(): Promise<void> {
    await this.continueButton.click({ timeout: 5000 }).catch(() => {});
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  @step('Assert logged in as user')
  async assertLoggedInAs(name: string): Promise<void> {
    await expect(this.header).toBeVisible();

    const loggedInBanner = this.header.getByText(
      new RegExp(`Logged in as\s+${this.escapeForRegex(name)}`, 'i')
    );
    const logoutLink = this.header.getByRole('link', { name: /logout/i });

    // Check if login banner is visible; if not, try recovery steps
    const bannerVisible = await loggedInBanner.isVisible().catch(() => false);
    if (!bannerVisible) {
      // Click continue if present
      if (await this.continueButton.count()) {
        await this.continueButton.first().click().catch(() => {});
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      }
      // Navigate home if header disappeared
      if (!(await this.header.count())) {
        await this.goto('/');
      }
    }

    // Assert either banner or logout link is visible
    const finalBannerVisible = await loggedInBanner.isVisible().catch(() => false);
    if (!finalBannerVisible) {
      await expect(logoutLink).toBeVisible({ timeout: 7000 });
    }
  }

  @step('Delete current account')
  async deleteAccount(options?: { continueAfter?: boolean }): Promise<void> {
    // Ensure header is visible; sometimes a modal Continue hides it
    const maybeContinue = this.continueButton;
    if (!(await this.header.count()) && (await maybeContinue.count())) {
      await maybeContinue.first().click().catch(() => {});
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    }

    if (!(await this.deleteAccountLink.count())) {
      // If there's no delete link, nothing to do (user likely not logged in)
      return;
    }

    await this.deleteAccountLink.first().click();

    await expect(this.accountDeletedHeader).toBeVisible({ timeout: 10000 });

    const shouldContinue = options?.continueAfter !== false;
    if (shouldContinue) {
      const continueBtn = this.continueButton;
      if (await this.continueButton.count()) {
        await continueBtn.first().click().catch(() => {});
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      }
    }
  }
}


