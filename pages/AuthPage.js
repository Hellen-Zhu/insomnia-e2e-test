const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class AuthPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.gitHubButton = page.getByRole('button', { name: 'Continue with GitHub' });
    this.googleButton = page.getByRole('button', { name: 'Continue with Google' });
    this.emailButton = page.getByRole('button', { name: 'Continue with Email' });
    this.ssoButton = page.getByRole('button', { name: 'Continue with Enterprise SSO' });
    this.emailInput = page.getByRole('textbox', { name: 'Email Email *' }); 
    this.companyEmailInput = page.getByRole('textbox', { name: 'Company Email Company Email *' });
    this.header = page.locator('div[class="flex items-center"]').first();
  }

  /**
   * Navigates to the authorization page and waits for the initial response.
   */
  async navigateToAuthPage() {
    try {
      await this.routeRequest('**/app/authorize', route => route.continue());
      const responsePromise = this.waitForResponse('**/app/authorize');
      await this.navigate('/app/authorize');
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      await this.assertElementVisible(this.header);
    } catch (error) {
      await this.handleError(error, 'AuthPage.navigateToAuthPage');
    }
  }

  /**
   * Clicks the "Continue with GitHub" button.
   * @returns {Promise<void>}
   */
  async loginWithGitHub() {
    try {
      await this.routeRequest('**/authorize?client_id**', route => route.continue());
      const responsePromise = this.waitForResponse('**/authorize?client_id**');
      await this.clickElement(this.gitHubButton);
      const response = await responsePromise;
      expect(response.status()).toBe(302);
    } catch (error) {
      await this.handleError(error, 'AuthPage.loginWithGitHub');
    }
  }

  /**
   * Clicks the "Continue with Google" button.
   * @returns {Promise<void>}
   */
  async loginWithGoogle() {
    try {
      await this.routeRequest('**/authorize?client_id**', route => route.continue());
      const responsePromise = this.waitForResponse('**/authorize?client_id**');
      await this.clickElement(this.googleButton);
      const response = await responsePromise;
      expect(response.status()).toBe(302);
    } catch (error) {
      await this.handleError(error, 'AuthPage.loginWithGoogle');
    }
  }

  /**
   * Starts the login process using email.
   * @param {string} email - User's email address
   */
  async loginWithEmail(email) {
    try {
      await this.clickElement(this.emailButton);
      await this.assertElementVisible(this.emailInput);
      await this.fillElement(this.emailInput, email);
      await this.clickElement(this.emailButton);
    } catch (error) {
      await this.handleError(error, 'AuthPage.loginWithEmail');
    }
  }

  /**
   * Starts the login process using SSO.
   * @param {string} companyEmail - Company email address
   */
  async loginWithSSO(companyEmail) {
    try {
      await this.clickElement(this.ssoButton);
      await this.assertElementVisible(this.companyEmailInput);
      await this.fillElement(this.companyEmailInput, companyEmail);

      await this.routeRequest('**/authorize?client_id**', route => route.continue());
      const responsePromise = this.waitForResponse('**/authorize?client_id**');
      await this.clickElement(this.ssoButton);
      const response = await responsePromise;
      expect(response.status()).toBe(302);
    } catch (error) {
      await this.handleError(error, 'AuthPage.loginWithSSO');
    }
  }

  /**
   * Asserts that the user is on the auth page.
   */
  async assertOnPage() {
    try {
      await this.assertURL('/app/authorize');
      await this.assertElementVisible(this.header);
      await this.assertElementVisible(this.gitHubButton);
      await this.assertElementVisible(this.googleButton);
      await this.assertElementVisible(this.emailButton);
      await this.assertElementVisible(this.ssoButton);
    } catch (error) {
      await this.handleError(error, 'AuthPage.assertOnPage');
    }
  }
}

module.exports = { AuthPage }; 