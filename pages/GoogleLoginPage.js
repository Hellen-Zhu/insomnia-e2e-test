const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class GoogleLoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.logo = page.getByRole('img', { name: 'Insomnia' });
    this.emailInput = page.getByRole('textbox', { name: 'Email or phone' });
    this.forgotEmailButton = page.getByRole('button', { name: 'Forgot email?' });
    this.createAccountButton = page.getByRole('button', { name: 'Create account' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.firstNameInput = page.getByRole('textbox', { name: 'First name' });
    this.lastNameInput = page.getByRole('textbox', { name: 'Last name' });
    this.registerPage = page.getByText('Create a Google Account', { exact: true });
    this.birthdayGenderPage = page.getByText('Enter your birthday and gender', { exact: true });
    this.unableToFindAccount = page.getByText('Unable to find your Google Account', { exact: true });
  }

  /**
   * Asserts that the user is on the Google login page.
   */
  async assertOnPage() {
    try {
      await this.assertElementVisible(this.logo);
      await this.assertElementVisible(this.emailInput);
      await this.assertElementVisible(this.forgotEmailButton);
      await this.assertElementVisible(this.createAccountButton);
      await this.assertElementVisible(this.nextButton);
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.assertOnPage');
    }
  }

  /**
   * Logs in with Google credentials.
   * @param {string} email - The Google email address.
   */
  async loginWithGoogle(email) {
    try {
      await this.fillElement(this.emailInput, email);
      await this.clickElement(this.nextButton);
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.loginWithGoogle');
    }
  }

  /**
   * Fills the email field.
   * @param {string} email - The Google email address.
   */
  async fillEmail(email) {
    try {
      await this.fillElement(this.emailInput, email);
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.fillEmail');
    }
  }

  /**
   * Clicks the next button.
   */
  async clickNext() {
    try {
      await this.clickElement(this.nextButton);
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.clickNext');
    }
  }

  /**
   * Clicks the forgot email button.
   */
  async clickForgotEmail() {
    try {
      await this.clickElement(this.forgotEmailButton);
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.clickForgotEmail');
    }
  }

  /**
   * Clicks the create account button.
   */
  async clickCreateAccount() {
    try {
      await this.clickElement(this.createAccountButton);
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.clickCreateAccount');
    }
  }

  /**
   * Asserts that the login form is visible.
   */
  async assertLoginFormVisible() {
    try {
      await this.assertElementVisible(this.emailInput);
      await this.assertElementVisible(this.nextButton);
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.assertLoginFormVisible');
    }
  }

  /**
   * Asserts that the unable sign in page is visible.
   */
  async assertWrongAccountPage() {
    try {
      await this.assertElementVisible(this.unableToFindAccount);
      
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.assertUnableSignInPage');
    }
  }
  /**
   * Waits for the page to load completely.
   */
  async waitForPageLoad() {
    try {
      await this.waitForPageLoad('networkidle');
      await this.assertElementVisible(this.logo);
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.waitForPageLoad');
    }
  }

  async registerNewAccount(firstName, lastName) {
    try {

      await this.waitForResponseStatus('**/flows/signup?**', this.createAccountButton, 302);  
      await this.assertRegisterPage();
      await this.fillElement(this.firstNameInput, firstName);
      await this.fillElement(this.lastNameInput, lastName);
      await this.clickElement(this.nextButton);
      await this.assertElementVisible(this.birthdayGenderPage);

      // Assume we can continue to next steps but it will fail as it finally need tel number to verify
      // Assume it will finally redirect to dashboard page after account created
      // await expect(this.page.url()).toContain('/dashboard');
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.registerNewAccount');
    }
  }

  async loginWithGoogleAccount(email) {
    try {
      await this.fillElement(this.emailInput, email);
      await this.clickElement(this.nextButton);
     
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.loginWithNewAccount');
    }
  }
  async assertRegisterPage() {
    try {
      await this.assertElementVisible(this.registerPage);
      await this.assertElementVisible(this.firstNameInput);
      await this.assertElementVisible(this.lastNameInput);
      await this.assertElementVisible(this.nextButton);
    } catch (error) {
      await this.handleError(error, 'GoogleLoginPage.assertRegisterPage');
    }
  }
}

module.exports = { GoogleLoginPage };