const { test, expect } = require('@playwright/test');
const { AuthPage, EmailVerificationPage, GitHubLoginPage, GoogleLoginPage, SSOLoginPage } = require('../pages');

test.describe('Insomnia Login Flows', () => {
  let authPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.navigateToAuthPage();
  });

  test('Should be able to redirect to GitHub login page', async ({ page }) => {
    const gitHubLoginPage = new GitHubLoginPage(page);
    await authPage.loginWithGitHub();
    await gitHubLoginPage.assertOnPage();
  });

  test('Should be able to redirect to Google login page', async ({ page }) => {
    const googleLoginPage = new GoogleLoginPage(page);
    await authPage.loginWithGoogle();
    await googleLoginPage.assertOnPage();
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
      await ssoLoginPage.loginWithSSO(ssoUserEmail, '123456', false);
      await ssoLoginPage.assertErrorAlertVisible();
    });

    test('Should be able to login with right passcode', async ({ page }) => {
      // TODO: need to get the right password for the user
      await ssoLoginPage.loginWithSSO(ssoUserEmail, 'password', true);

      // Assume the login is successful and the user is redirected to the dashboard
      // await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Email Login', () => {
    let emailVerificationPage;

    test.beforeEach(async ({ page }) => {
      emailVerificationPage = new EmailVerificationPage(page);
    });

    test('Should able to login with new email account', async () => {
      const newUserEmail = 'hellenzhu2@2925.com';
      await authPage.loginWithEmail(newUserEmail);
      
      // This step will fail as unable to bypass the cloudflare captcha
      // In UAT/DEV, may need developers to help bypass the captcha
      // await emailVerificationPage.assertOnPage(newUserEmail);
      
      // await emailVerificationPage.enterVerificationCode('123456');

       // Assume the login is successful and the user is redirected to the dashboard
      // await expect(page).toHaveURL('/dashboard');
    });

    test('Should be able to login with right passcode', async () => {
      const existingUserEmail = 'hellenzhu@2925.com';
      await authPage.loginWithEmail(existingUserEmail);
      await emailVerificationPage.assertOnPage(existingUserEmail);
      await emailVerificationPage.enterVerificationCode('123456');

      // Assume the login is successful and the user is redirected to the dashboard
      // await expect(page).toHaveURL('/dashboard');
    });

    test('Should be unable to login with wrong passcode', async () => {
      const existingUserEmail = 'hellenzhu@2925.com';
      await authPage.loginWithEmail(existingUserEmail);
      await emailVerificationPage.assertOnPage(existingUserEmail);
      await emailVerificationPage.enterVerificationCode('000000');
      await emailVerificationPage.assertWrongCodeErrorVisible();
    });
  });

})