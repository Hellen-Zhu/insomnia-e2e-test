const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class GitHubLoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.loginForm = page.locator('#login');
    this.gitHubHomeLink = page.getByRole('link', { name: 'Homepage' });
    this.logo = page.getByRole('img', { name: 'Insomnia logo' });
    this.loginHeader = page.getByText('Sign in to GitHub to continue');
    this.emailInput = page.getByRole('textbox', { name: 'Username or email address' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.forgotPasswordButton = page.getByRole('link', { name: 'Forgot password?' });
    this.signInWithKey = page.getByRole('button', { name: 'Sign in with a passkey' });
    this.createAccountButton = page.getByRole('link', { name: 'Create an account' });
  }

  /**
   * Asserts that the user is on the GitHub login page by checking the URL and visibility of elements.
   */
  async assertOnPage() {
    try {
      await this.assertURL(/https:\/\/github\.com\/login/);
      await this.assertElementVisible(this.gitHubHomeLink);
      await this.assertElementVisible(this.logo);
      await this.assertElementVisible(this.loginHeader);
      await this.assertElementVisible(this.emailInput);
      await this.assertElementVisible(this.passwordInput);
      await this.assertElementVisible(this.signInButton);
      await this.assertElementVisible(this.forgotPasswordButton);
      await this.assertElementVisible(this.signInWithKey);
      await this.assertElementVisible(this.createAccountButton);
    } catch (error) {
      await this.handleError(error, 'GitHubLoginPage.assertOnPage');
    }
  }

  /**
   * Logs in with GitHub credentials.
   * @param {string} email - The GitHub email address.
   * @param {string} password - The GitHub password.
   */
  async loginWithGitHub(email, password) {
    try {
      await this.fillElement(this.emailInput, email);
      await this.fillElement(this.passwordInput, password);
      await this.clickElement(this.signInButton);
    } catch (error) {
      await this.handleError(error, 'GitHubLoginPage.loginWithGitHub');
    }
  }

  /**
   * Fills only the email field (for step-by-step login).
   * @param {string} email - The GitHub email address.
   */
  async fillEmail(email) {
    try {
      await this.fillElement(this.emailInput, email);
    } catch (error) {
      await this.handleError(error, 'GitHubLoginPage.fillEmail');
    }
  }

  /**
   * Fills only the password field.
   * @param {string} password - The GitHub password.
   */
  async fillPassword(password) {
    try {
      await this.fillElement(this.passwordInput, password);
    } catch (error) {
      await this.handleError(error, 'GitHubLoginPage.fillPassword');
    }
  }

  /**
   * Clicks the sign in button.
   */
  async clickSignIn() {
    try {
      await this.clickElement(this.signInButton);
    } catch (error) {
      await this.handleError(error, 'GitHubLoginPage.clickSignIn');
    }
  }

  /**
   * Clicks the forgot password link.
   */
  async clickForgotPassword() {
    try {
      await this.clickElement(this.forgotPasswordButton);
    } catch (error) {
      await this.handleError(error, 'GitHubLoginPage.clickForgotPassword');
    }
  }

  /**
   * Clicks the create account link.
   */
  async clickCreateAccount() {
    try {
      await this.clickElement(this.createAccountButton);
    } catch (error) {
      await this.handleError(error, 'GitHubLoginPage.clickCreateAccount');
    }
  }

  /**
   * Asserts that the login form is visible.
   */
  async assertLoginFormVisible() {
    try {
      await this.assertElementVisible(this.loginForm);
      await this.assertElementVisible(this.emailInput);
      await this.assertElementVisible(this.passwordInput);
      await this.assertElementVisible(this.signInButton);
    } catch (error) {
      await this.handleError(error, 'GitHubLoginPage.assertLoginFormVisible');
    }
  }
}

module.exports = { GitHubLoginPage }; 