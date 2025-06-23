const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class EmailVerificationPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.checkEmailMessage = page.getByText('Check your email');
    this.verificationMessage = page.getByText('We\'ve sent a verification email to');
    this.manualEntryMessage = page.getByText('Enter code manually or click on the link in the email.');
    this.errorMessage = page.getByText('Wrong email or verification code.');
    this.goBackButton = page.getByRole('link', { name: 'Go Back' });
  }

  /**
   * Returns a locator for the email display paragraph.
   * @param {string} email - Email address to display
   * @returns {import('@playwright/test').Locator} Email display locator
   */
  emailDisplay(email) {
    return this.page.getByText(`${email}.`);
  }

  /**
   * Asserts that the user is on the email verification page.
   * @param {string} email - The email address that should be displayed on the page.
   */
  async assertOnPage(email) {
    try {
      await this.assertURL("/app/authorize/email");
      await this.assertElementVisible(this.checkEmailMessage);
      await this.assertElementVisible(this.verificationMessage);
      await this.assertElementVisible(this.emailDisplay(email));
      await this.assertElementVisible(this.manualEntryMessage);
      await this.assertElementVisible(this.goBackButton);
    } catch (error) {
      await this.handleError(error, 'EmailVerificationPage.assertOnPage');
    }
  }

  /**
   * Enters the 6-digit verification code.
   * @param {string} code - 6-digit verification code
   */
  async enterVerificationCode(code) {
    try {
      for (let i = 1; i <= code.length; i++) {
        const inputLocator = this.page.locator(`input:nth-child(${i})`);
        await this.fillElement(inputLocator, code[i-1]);
      }
    } catch (error) {
      await this.handleError(error, 'EmailVerificationPage.enterVerificationCode');
    }
  }

  /**
   * Asserts that the "Wrong code" error message is visible.
   */
  async assertWrongCodeErrorVisible() {
    try {
      await this.assertElementVisible(this.errorMessage);
    } catch (error) {
      await this.handleError(error, 'EmailVerificationPage.assertWrongCodeErrorVisible');
    }
  }

  /**
   * Asserts that all verification code input boxes have the error-state class.
   * @param {number} expectedCount - The number of input boxes expected (default: 6)
   */
  async assertInputBoxesHaveErrorState(expectedCount = 6) {
    try {
      const errorInputs = this.page.locator('input.border-error');
      await this.assertElementCount(errorInputs, expectedCount);
    } catch (error) {
      await this.handleError(error, 'EmailVerificationPage.assertInputBoxesHaveErrorState');
    }
  }

  /**
   * Clicks the go back button.
   */
  async clickGoBack() {
    try {
      await this.clickElement(this.goBackButton);
    } catch (error) {
      await this.handleError(error, 'EmailVerificationPage.clickGoBack');
    }
  }

  /**
   * Fills a specific verification code input field.
   * @param {number} index - Input field index (1-6)
   * @param {string} digit - Single digit to enter
   */
  async fillVerificationDigit(index, digit) {
    try {
      const inputLocator = this.page.locator(`input:nth-child(${index})`);
      await this.fillElement(inputLocator, digit);
    } catch (error) {
      await this.handleError(error, `EmailVerificationPage.fillVerificationDigit-${index}`);
    }
  }

  /**
   * Clears all verification code input fields.
   */
  async clearVerificationCode() {
    try {
      for (let i = 1; i <= 6; i++) {
        const inputLocator = this.page.locator(`input:nth-child(${i})`);
        await this.fillElement(inputLocator, '');
      }
    } catch (error) {
      await this.handleError(error, 'EmailVerificationPage.clearVerificationCode');
    }
  }

  /**
   * Asserts that all verification code input fields are empty.
   */
  async assertVerificationCodeEmpty() {
    try {
      for (let i = 1; i <= 6; i++) {
        const inputLocator = this.page.locator(`input:nth-child(${i})`);
        await this.assertElementHasValue(inputLocator, '');
      }
    } catch (error) {
      await this.handleError(error, 'EmailVerificationPage.assertVerificationCodeEmpty');
    }
  }

  /**
   * Waits for the verification page to load completely.
   */
  async waitForPageLoad() {
    try {
      await this.waitForPageLoad('networkidle');
      await this.assertElementVisible(this.checkEmailMessage);
    } catch (error) {
      await this.handleError(error, 'EmailVerificationPage.waitForPageLoad');
    }
  }

  /**
   * Asserts that the verification form is visible.
   */
  async assertVerificationFormVisible() {
    try {
      // Check that all 6 input fields are visible
      for (let i = 1; i <= 6; i++) {
        const inputLocator = this.page.locator(`input:nth-child(${i})`);
        await this.assertElementVisible(inputLocator);
      }
    } catch (error) {
      await this.handleError(error, 'EmailVerificationPage.assertVerificationFormVisible');
    }
  }
}

module.exports = { EmailVerificationPage }; 