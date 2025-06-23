const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { GitHubLoginPage } = require('../pages/GitHubLoginPage');
const { EmailVerificationPage } = require('../pages/EmailVerificationPage');
const { SSOLoginPage } = require('../pages/SSOLoginPage');

test.describe('Insomnia Login Flows', () => {
  let authPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.navigate();
  });

  test('Should be able to redirect to GitHub login page', async ({ page }) => {
    await authPage.loginWithGitHub();
    await expect(page).toHaveURL(/https:\/\/github\.com\/login/);
  });

  test('Should be able to redirect to Google login page', async ({ page }) => {
    await authPage.loginWithGoogle();
    await expect(page).toHaveURL(/https:\/\/accounts\.google\.com/);
    await expect(page.getByRole('img', { name: 'Insomnia' })).toBeVisible();
  });

  test.describe('SSO Login', () => {
    const ssoUserEmail = 'insomnia-user@konghq.com';
    let ssoLoginPage;

    test.beforeEach(async ({ page }) => {
      ssoLoginPage = new SSOLoginPage(page);
      await authPage.loginWithSSO(ssoUserEmail);
      await ssoLoginPage.assertOnPage();
    });

    test('Should be unable to login with wrong passcode', async () => {
      await ssoLoginPage.loginWithWrongPasscode(ssoUserEmail, '123456', false);
    });

    test('Should be able to login with right passcode', async ({ page }) => {
      // TODO: need to get the right password for the user
      await ssoLoginPage.loginWithRightPasscode(ssoUserEmail, 'password', true);

      // Assume the login is successful and the user is redirected to the dashboard
      // await expect(page).toHaveURL('/dashboard');
    });
  });
})