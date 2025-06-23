// pages/BasePage.js
const { expect } = require('@playwright/test');

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a URL
   * @param {string} url - The URL to navigate to
   * @param {Object} options - Navigation options
   */
  async navigate(url, options = {}) {
    await this.page.goto(url, options);
  }

  /**
   * Click on an element
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {Object} options - Click options
   */
  async clickElement(locator, options = {}) {
    await locator.click(options);
  }

  /**
   * Fill an input field
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {string} text - Text to fill
   */
  async fillElement(locator, text) {
    await locator.fill(text);
  }

  /**
   * Wait for page to load
   * @param {string} state - Load state ('load', 'domcontentloaded', 'networkidle')
   */
  async waitForPageLoad(state = 'networkidle') {
    await this.page.waitForLoadState(state);
  }

  /**
   * Wait for URL to match pattern
   * @param {string|RegExp} url - URL pattern to wait for
   */
  async waitForURL(url) {
    await this.page.waitForURL(url);
  }

  /**
   * Wait for response
   * @param {string} url - URL pattern to wait for
   * @returns {Promise<import('@playwright/test').Response>} Response object
   */
  async waitForResponse(url) {
    return await this.page.waitForResponse(url);
  }

  /**
   * Route network requests
   * @param {string} url - URL pattern to route
   * @param {Function} handler - Route handler function
   */
  async routeRequest(url, handler) {
    await this.page.route(url, handler);
  }

  /**
   * Assert URL matches pattern
   * @param {string|RegExp} url - URL pattern to assert
   */
  async assertURL(url) {
    await expect(this.page).toHaveURL(url);
  }

  /**
   * Assert element is visible
   * @param {import('@playwright/test').Locator} locator - Element locator
   */
  async assertElementVisible(locator) {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert element has value
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {string} value - Expected value
   */
  async assertElementHasValue(locator, value) {
    await expect(locator).toHaveValue(value);
  }

  /**
   * Assert element count
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {number} count - Expected count
   */
  async assertElementCount(locator, count) {
    await expect(locator).toHaveCount(count);
  }

  /**
   * Assert element has text
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {string} text - Expected text
   */
  async assertElementHasText(locator, text) {
    await expect(locator).toHaveText(text); 
  }
  
  /**
   * Take screenshot
   * @param {string} path - Screenshot file path
   * @param {Object} options - Screenshot options
   */
  async takeScreenshot(path, options = {}) {
    await this.page.screenshot({ path, ...options });
  }

  /**
   * Handle errors with screenshot
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  async handleError(error, context) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `error-${context}-${timestamp}.png`;
    await this.takeScreenshot(screenshotPath);
    console.error(`Error in ${context}:`, error.message);
    throw error;
  }
}

module.exports = { BasePage };