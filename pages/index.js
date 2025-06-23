// Import all page classes
const { AuthPage } = require('./AuthPage');
const { GitHubLoginPage } = require('./GitHubLoginPage');
const { GoogleLoginPage } = require('./GoogleLoginPage');
const { SSOLoginPage } = require('./SSOLoginPage');
const { EmailVerificationPage } = require('./EmailVerificationPage');
const { BasePage } = require('./BasePage');

/**
 * Page class collection
 * @typedef {Object} Pages
 * @property {typeof AuthPage} AuthPage - Auth page class
 * @property {typeof GitHubLoginPage} GitHubLoginPage - GitHub login page class
 * @property {typeof GoogleLoginPage} GoogleLoginPage - Google login page class
 * @property {typeof SSOLoginPage} SSOLoginPage - SSO login page class
 * @property {typeof EmailVerificationPage} EmailVerificationPage - Email verification page class
 * @property {typeof BasePage} BasePage - Base page class
 */

/**
 * Export all page classes
 * @type {Pages}
 */
module.exports = {
  AuthPage,
  GitHubLoginPage,
  GoogleLoginPage,
  SSOLoginPage,
  EmailVerificationPage,
  BasePage
}; 