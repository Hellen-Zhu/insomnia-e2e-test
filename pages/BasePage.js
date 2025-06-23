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
   * Wait for element to be visible
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForElementVisible(locator, timeout = 10000) {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * Wait for element to be hidden
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForElementHidden(locator, timeout = 10000) {
    await expect(locator).toBeHidden({ timeout });
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
   * Type text into an element
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {string} text - Text to type
   */
  async typeElement(locator, text) {
    await locator.type(text);
  }

  /**
   * Press a key on an element
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {string} key - Key to press
   */
  async pressKey(locator, key) {
    await locator.press(key);
  }

  /**
   * Get text content of an element
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @returns {Promise<string>} Text content
   */
  async getElementText(locator) {
    return await locator.textContent();
  }

  /**
   * Get attribute value of an element
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {string} attribute - Attribute name
   * @returns {Promise<string|null>} Attribute value
   */
  async getElementAttribute(locator, attribute) {
    return await locator.getAttribute(attribute);
  }

  /**
   * Check if element is visible
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @returns {Promise<boolean>} True if visible
   */
  async isElementVisible(locator) {
    return await locator.isVisible();
  }

  /**
   * Check if element is enabled
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @returns {Promise<boolean>} True if enabled
   */
  async isElementEnabled(locator) {
    return await locator.isEnabled();
  }

  /**
   * Wait for page to load
   * @param {string} state - Load state ('load', 'domcontentloaded', 'networkidle')
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForPageLoad(state = 'networkidle', timeout = 30000) {
    await this.page.waitForLoadState(state, { timeout });
  }

  /**
   * Wait for URL to match pattern
   * @param {string|RegExp} url - URL pattern to wait for
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForURL(url, timeout = 10000) {
    await this.page.waitForURL(url, { timeout });
  }

  /**
   * Wait for response
   * @param {string} url - URL pattern to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<import('@playwright/test').Response>} Response object
   */
  async waitForResponse(url, timeout = 15000) {
    return await this.page.waitForResponse(url, { timeout });
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
   * Assert element is hidden
   * @param {import('@playwright/test').Locator} locator - Element locator
   */
  async assertElementHidden(locator) {
    await expect(locator).toBeHidden();
  }

  /**
   * Assert element has text
   * @param {import('@playwright/test').Locator} locator - Element locator
   * @param {string|RegExp} text - Expected text
   */
  async assertElementHasText(locator, text) {
    await expect(locator).toHaveText(text);
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
   * Take screenshot
   * @param {string} path - Screenshot file path
   * @param {Object} options - Screenshot options
   */
  async takeScreenshot(path, options = {}) {
    await this.page.screenshot({ path, ...options });
  }

  /**
   * Wait for timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForTimeout(timeout) {
    await this.page.waitForTimeout(timeout);
  }

  /**
   * Reload page
   * @param {Object} options - Reload options
   */
  async reload(options = {}) {
    await this.page.reload(options);
  }

  /**
   * Go back
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Go forward
   */
  async goForward() {
    await this.page.goForward();
  }

  /**
   * Get page title
   * @returns {Promise<string>} Page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Get current URL
   * @returns {string} Current URL
   */
  getCurrentURL() {
    return this.page.url();
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