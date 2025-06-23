const { expect } = require('@playwright/test');

class SSOLoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.loginHeader = page.getByRole('heading', { name: 'Sign in with your account to access KongHQ Insomnia' });
    this.logo = page.getByRole('img', { name: 'Kong logo logo' });
    this.header = page.getByRole('heading', { name: 'Sign in' });
    this.usernameInput = page.locator('#okta-signin-username');
    this.passwordInput = page.locator('#okta-signin-password');    
    this.saveMyInfoButton = page.locator('input[type="checkbox"]')
    this.loginButton = page.getByRole('button', { name: 'Sign in' });
    this.errorAlertContainer = page.locator('div[role="alert"].infobox-error');
  }

  /**
   * Asserts that the user is on the GitHub login page by checking the URL and visibility of elements.
   */
  async assertOnPage() {
    await expect(this.page).toHaveURL(/https:\/\/konghq\.okta\.com\/login\/login\.htm/);
    await expect(this.logo).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.saveMyInfoButton).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Private method to fill and submit the login form.
   * Not intended to be called directly from tests.
   * @param {string} username
   * @param {string} password
   * @param {boolean} saveMyInfo
   * @private
   */
  async loginWithSSO(username, password, saveMyInfo) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    
    const isChecked = await this.saveMyInfoButton.isChecked();
    if (saveMyInfo !== isChecked) {
        await this.saveMyInfoButton.click({ force: true });
    }
    await this.loginButton.click();
  }

  /**
   * Asserts that the error alert is visible.
   */
  async assertErrorAlertVisible() {
    await expect(this.errorAlertContainer).toBeVisible();
    await expect(this.errorAlertContainer).toHaveText('Unable to sign in');
  }

  /**
   * Asserts that the user is redirected to the dashboard after successful login.
   */
  async assertLoginSuccess() {
    // Assuming the user is redirected to the dashboard after successful login
    await expect(this.page).toHaveURL(/https:\/\/app\.insomnia\.rest\/app\/dashboard/);
  }
}

module.exports = { SSOLoginPage }; 