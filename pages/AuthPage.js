const { expect } = require('@playwright/test');

class AuthPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.gitHubButton = page.getByRole('button', { name: 'Continue with GitHub' });
    this.googleButton = page.getByRole('button', { name: 'Continue with Google' });
    this.emailButton = page.getByRole('button', { name: 'Continue with Email' });
    this.ssoButton = page.getByRole('button', { name: 'Continue with Enterprise SSO' });
    this.emailInput = page.getByRole('textbox', { name: 'Email Email *' }); 
    this.companyEmailInput=page.getByRole('textbox', { name: 'Company Email Company Email *' });
    this.header = page.locator('div[class="flex items-center"]').first();
  }

  /**
   * Navigates to the authorization page and waits for the initial response.
   */
  async navigate() {
    await this.page.route('**/app/authorize', route => route.continue());
    const responsePromise = this.page.waitForResponse('**/app/authorize');
    await this.page.goto('/app/authorize');
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await expect(this.header).toBeVisible();
  }

  /**
   * Clicks the "Continue with GitHub" button.
   * @returns {Promise<void>}
   */
  async loginWithGitHub() {
    await this.page.route('**/authorize?client_id**', route => route.continue());
    const responsePromise = this.page.waitForResponse('**/authorize?client_id**');
    await this.gitHubButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(302);
  }

  /**
   * Clicks the "Continue with Google" button.
   * @returns {Promise<void>}
   */
  async loginWithGoogle() {
    await this.page.route('**/authorize?client_id**', route => route.continue());
    const responsePromise = this.page.waitForResponse('**/authorize?client_id**');
    await this.googleButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(302);
  }

  /**
   * Starts the login process using email.
   * @param {string} email
   */
  async loginWithEmail(email) {
    await this.emailButton.click();
    await expect(this.emailInput).toBeVisible();
    await this.emailInput.fill(email);
    await this.emailButton.click();
  }

  async loginWithSSO(companyEmail) {
    await this.ssoButton.click();
    await expect(this.companyEmailInput).toBeVisible();
    await this.companyEmailInput.fill(companyEmail);

    await this.page.route('**/authorize?client_id**', route => route.continue());
    const responsePromise = this.page.waitForResponse('**/authorize?client_id**');
    await this.ssoButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(302);
  }
}

module.exports = { AuthPage }; 