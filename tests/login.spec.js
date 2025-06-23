const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');

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
  });

  test('Should be able to redirect to SSO login page', async ({ page }) => {
    await authPage.loginWithSSO('insomnia-user@konghq.com');
    await expect(page).toHaveURL(/https:\/\/konghq\.okta\.com\/login\/login\.htm/);
  });
})