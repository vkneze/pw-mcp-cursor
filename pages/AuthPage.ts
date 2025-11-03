import { Page, Locator, expect } from '@playwright/test';
import { BasePage, step } from './BasePage';
import { defaultDateOfBirth } from '../data/auth';
import { AUTH, COMMON } from '../constants/selectors';

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
    this.header = page.locator(COMMON.HEADER);

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
    this.titleMrRadio = page.locator(AUTH.TITLE_MR_RADIO);
    this.titleMrLabel = page.locator(AUTH.TITLE_MR_LABEL).first();
    this.accountPasswordInput = page.locator('[data-qa="password"]').or(page.getByLabel(/password/i));
    this.daySelect = page.locator(AUTH.DAY_SELECT);
    this.monthSelect = page.locator(AUTH.MONTH_SELECT);
    this.yearSelect = page.locator(AUTH.YEAR_SELECT);
    this.newsletterCheckbox = page.locator(AUTH.NEWSLETTER_CHECKBOX);
    this.offersCheckbox = page.locator(AUTH.OFFERS_CHECKBOX);
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

  /**
   * Navigate to the login page and verify it loaded successfully.
   */
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

  /**
   * Log in with an existing user account.
   * @param email - User's email address
   * @param password - User's password
   * @throws {Error} If login fails with incorrect credentials
   */
  @step('Login with existing user credentials')
  async loginExistingUser(email: string, password: string): Promise<void> {
    await expect(this.loginEmailInput.first()).toBeVisible();
    await this.loginEmailInput.first().fill(email);
    await this.loginPasswordInput.first().fill(password);
    await this.loginButton.first().click();

    const outcome = await Promise.race([
      this.safeWaitFor(this.logoutLink, { state: 'visible', timeout: 12000 }).then((success) => success ? 'success' : null),
      this.safeWaitFor(this.loginErrorMsg, { state: 'visible', timeout: 12000 }).then((success) => success ? 'error' : null),
    ]);

    if (outcome === 'error' || (await this.safeIsVisible(this.loginErrorMsg))) {
      throw new Error('Incorrect email or password');
    }

    await expect(this.logoutLink).toBeVisible();
  }

  /**
   * Navigate to the signup page and verify it loaded successfully.
   */
  @step('Open the signup page')
  async gotoSignup(): Promise<void> {
    await this.goto('/signup');
    await expect(this.signupHeader).toBeVisible();
  }

  /**
   * Register a new user account with complete profile information.
   * @param params - User registration details including personal and address information
   * @param options - Optional configuration (e.g., autoContinue to proceed after account creation)
   */
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
    
    // Step 2: Wait for navigation and check for duplicate email error
    await this.page.waitForLoadState('networkidle');
    
    // Safety check: ensure no duplicate email error (should not happen with unique email generation)
    const duplicateEmailError = this.page.getByText(/Email Address already exist/i);
    if (await duplicateEmailError.isVisible().catch(() => false)) {
      throw new Error(`Duplicate email detected: ${email}. Check email uniqueness generation.`);
    }

    // Title radio
    await this.safeClick(this.titleMrLabel, { force: true });

    // Password
    await this.accountPasswordInput.fill(password);

    // Date of birth
    await this.daySelect.selectOption(defaultDateOfBirth.day);
    await this.monthSelect.selectOption(defaultDateOfBirth.month);
    await this.yearSelect.selectOption(defaultDateOfBirth.year);

    // Newsletter / offers boxes (optional) — best-effort, ignore failures
    if (await this.newsletterCheckbox.count()) await this.newsletterCheckbox.setChecked(true, { force: true }).catch(() => {});
    if (await this.offersCheckbox.count()) await this.offersCheckbox.setChecked(true, { force: true }).catch(() => {});

    // Address information
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.address1Input.fill(address1);
    await this.countrySelect.selectOption({ label: country });
    await this.stateInput.fill(state);
    await this.cityInput.fill(city);
    await this.zipcodeInput.fill(zipcode);
    await this.mobileInput.fill(mobile);

    // Create account
    await this.createAccountButton.click();

    await expect(this.accountCreatedHeader).toBeVisible();

    const shouldContinue = options?.autoContinue !== false;
    if (shouldContinue) {
      await this.continueAfterAccountCreated();
    }
  }

  /**
   * Verify that the account created confirmation message is visible.
   */
  @step('Assert account created message is visible')
  async assertAccountCreatedMessage(): Promise<void> {
    await expect(this.accountCreatedHeader).toBeVisible();
  }

  /**
   * Click the continue button after account creation to proceed to the main site.
   */
  @step('Continue after account created')
  async continueAfterAccountCreated(): Promise<void> {
    await this.safeClick(this.continueButton, { timeout: 5000 });
    await this.safeWaitForLoadState('domcontentloaded');
  }

  /**
   * Assert that the user is logged in with the specified name.
   * @param name - The expected username to verify in the logged-in banner
   */
  @step('Assert logged in as user')
  async assertLoggedInAs(name: string): Promise<void> {
    await expect(this.header).toBeVisible();

    const loggedInBanner = this.header.getByText(
      new RegExp(`Logged in as\s+${this.escapeForRegex(name)}`, 'i')
    );
    const logoutLink = this.header.getByRole('link', { name: /logout/i });

    // Check if login banner is visible; if not, try recovery steps
    const bannerVisible = await this.safeIsVisible(loggedInBanner);
    if (!bannerVisible) {
      // Click continue if present
      if (await this.continueButton.count()) {
        await this.safeClick(this.continueButton.first());
        await this.safeWaitForLoadState('domcontentloaded');
      }
      // Navigate home if header disappeared
      if (!(await this.header.count())) {
        await this.goto('/');
      }
    }

    // Assert either banner or logout link is visible
    const finalBannerVisible = await this.safeIsVisible(loggedInBanner);
    if (!finalBannerVisible) {
      await expect(logoutLink).toBeVisible({ timeout: 7000 });
    }
  }

  /**
   * Delete the currently logged-in user account.
   * @param options - Optional configuration (e.g., continueAfter to click continue after deletion)
   */
  @step('Delete current account')
  async deleteAccount(options?: { continueAfter?: boolean }): Promise<void> {
    // Ensure header is visible; sometimes a modal Continue hides it
    const maybeContinue = this.continueButton;
    if (!(await this.header.count()) && (await maybeContinue.count())) {
      await this.safeClick(maybeContinue.first());
      await this.safeWaitForLoadState('domcontentloaded');
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
        await this.safeClick(continueBtn.first());
        await this.safeWaitForLoadState('domcontentloaded');
      }
    }
  }
}


