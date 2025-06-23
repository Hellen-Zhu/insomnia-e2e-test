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
}

module.exports = { GoogleLoginPage };