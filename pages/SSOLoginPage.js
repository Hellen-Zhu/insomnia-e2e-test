const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class SSOLoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.loginHeader = page.getByRole('heading', { name: 'Sign in with your account to access KongHQ Insomnia' });
    this.logo = page.getByRole('img', { name: 'Kong logo logo' });
    this.header = page.getByRole('heading', { name: 'Sign in' });
    this.usernameInput = page.locator('#okta-signin-username');
    this.passwordInput = page.locator('#okta-signin-password');    
    this.saveMyInfoButton = page.locator('input[type="checkbox"]');
    this.loginButton = page.getByRole('button', { name: 'Sign in' });
    this.errorAlertContainer = page.locator('div[role="alert"].infobox-error');
  }

  /**
   * Asserts that the user is on the SSO login page by checking the URL and visibility of elements.
   */
  async assertOnPage() {
    try {
      await this.assertURL(/https:\/\/konghq\.okta\.com\/login\/login\.htm/);
      await this.assertElementVisible(this.logo);
      await this.assertElementVisible(this.usernameInput);
      await this.assertElementVisible(this.passwordInput);
      await this.assertElementVisible(this.saveMyInfoButton);
      await this.assertElementVisible(this.loginButton);
    } catch (error) {
      await this.handleError(error, 'SSOLoginPage.assertOnPage');
    }
  }

  /**
   * Private method to fill and submit the login form.
   * Not intended to be called directly from tests.
   * @param {string} username - Username for login
   * @param {string} password - Password for login
   * @param {boolean} saveMyInfo - Whether to save login info
   * @private
   */
  async loginWithSSO(username, password, saveMyInfo) {
    try {
      await this.fillElement(this.usernameInput, username);
      await this.fillElement(this.passwordInput, password);
      
      const isChecked = await this.saveMyInfoButton.isChecked();
      if (saveMyInfo !== isChecked) {
        await this.clickElement(this.saveMyInfoButton, { force: true });
      }
      await this.clickElement(this.loginButton);
    } catch (error) {
      await this.handleError(error, 'SSOLoginPage.loginWithSSO');
    }
  }

  /**
   * Asserts that the error alert is visible.
   */
  async assertErrorAlertVisible() {
    try {
      await this.assertElementVisible(this.errorAlertContainer);
      await this.assertElementHasText(this.errorAlertContainer, 'Unable to sign in');
    } catch (error) {
      await this.handleError(error, 'SSOLoginPage.assertErrorAlertVisible');
    }
  }

  /**
   * Asserts that the user is redirected to the dashboard after successful login.
   */
  async assertLoginSuccess() {
    try {
      // Assuming the user is redirected to the dashboard after successful login
      await this.assertURL(/https:\/\/app\.insomnia\.rest\/app\/dashboard/);
    } catch (error) {
      await this.handleError(error, 'SSOLoginPage.assertLoginSuccess');
    }
  }

  /**
   * Fills the username field.
   * @param {string} username - Username to fill
   */
  async fillUsername(username) {
    try {
      await this.fillElement(this.usernameInput, username);
    } catch (error) {
      await this.handleError(error, 'SSOLoginPage.fillUsername');
    }
  }

  /**
   * Fills the password field.
   * @param {string} password - Password to fill
   */
  async fillPassword(password) {
    try {
      await this.fillElement(this.passwordInput, password);
    } catch (error) {
      await this.handleError(error, 'SSOLoginPage.fillPassword');
    }
  }

  /**
   * Sets the save my info checkbox.
   * @param {boolean} saveMyInfo - Whether to check the save info checkbox
   */
  async setSaveMyInfo(saveMyInfo) {
    try {
      const isChecked = await this.saveMyInfoButton.isChecked();
      if (saveMyInfo !== isChecked) {
        await this.clickElement(this.saveMyInfoButton, { force: true });
      }
    } catch (error) {
      await this.handleError(error, 'SSOLoginPage.setSaveMyInfo');
    }
  }

  /**
   * Clicks the sign in button.
   */
  async clickSignIn() {
    try {
      await this.clickElement(this.loginButton);
    } catch (error) {
      await this.handleError(error, 'SSOLoginPage.clickSignIn');
    }
  }

  /**
   * Asserts that the login form is visible.
   */
  async assertLoginFormVisible() {
    try {
      await this.assertElementVisible(this.usernameInput);
      await this.assertElementVisible(this.passwordInput);
      await this.assertElementVisible(this.loginButton);
    } catch (error) {
      await this.handleError(error, 'SSOLoginPage.assertLoginFormVisible');
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
      await this.handleError(error, 'SSOLoginPage.waitForPageLoad');
    }
  }
}

module.exports = { SSOLoginPage }; 