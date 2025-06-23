const { test } = require('@playwright/test');
const { AuthPage, EmailVerificationPage, GitHubLoginPage, GoogleLoginPage, SSOLoginPage } = require('../pages');

test.describe('Insomnia Login Flows', () => {
  let authPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.navigateToAuthPage();
  });

  test('@smoke should load authorize page successfully', async () => {    
    await authPage.assertOnPage();
  });  

  test.describe('Google Login', () => {
    test('@smoke Should be able to redirect to Google login page', async ({ page }) => {
      const googleLoginPage = new GoogleLoginPage(page);
      await authPage.loginWithGoogle();
      await googleLoginPage.assertOnPage();
    });
  
    test('@regression Should able to register new google account and login with it', async ({ page }) => {
      const googleLoginPage = new GoogleLoginPage(page);
      await authPage.loginWithGoogle();
      await googleLoginPage.assertOnPage();
      await googleLoginPage.registerNewAccount('Hellen', 'Zhu');
  
      // This step will fail as it finally need tel number to verify
      // Assume it will finally redirect to dashboard page after account created
      // await expect(this.page.url()).toContain('/dashboard');  
      
    });
  
    test('@regression Should unable to login with wrong google account', async ({ page }) => {
      const googleLoginPage = new GoogleLoginPage(page);
      await authPage.loginWithGoogle();
      await googleLoginPage.assertOnPage();
      await googleLoginPage.loginWithGoogleAccount('hellenzhu@2925.com');

      // In production, it will show "Unable to find your Google Account"
      // But this case will fail in Playwright, it saying 'Couldn't sign you in'
      // await googleLoginPage.assertWrongAccountPage();      
    });

    test('@regression Should able to login with existing google account', async ({ page }) => {
      const googleLoginPage = new GoogleLoginPage(page);
      await authPage.loginWithGoogle();
      await googleLoginPage.assertOnPage();
      await googleLoginPage.loginWithGoogleAccount('hellenzhu@outlook.com');
  
      // This step will fail as it finally need tel number to verify
      // Assume it will finally redirect to dashboard page after account created
      // await expect(this.page.url()).toContain('/dashboard');  
      
    });
  });
  
  test.describe('GitHub Login', () => {
    test('@smoke Should be able to redirect to GitHub login page', async ({ page }) => {
      const gitHubLoginPage = new GitHubLoginPage(page);
      await authPage.loginWithGitHub();
      await gitHubLoginPage.assertOnPage();
    });
  });

  test.describe('SSO Login', () => {
    const ssoUserEmail = 'insomnia-user@konghq.com';
    let ssoLoginPage;

    test.beforeEach(async ({ page }) => {
      ssoLoginPage = new SSOLoginPage(page);
      await authPage.loginWithSSO(ssoUserEmail);
      await ssoLoginPage.assertOnPage();
    });

    test('@regression Should be unable to login with wrong passcode', async () => {
      await ssoLoginPage.loginWithSSO(ssoUserEmail, '123456', false);
      await ssoLoginPage.assertErrorAlertVisible();
    });

    test('@regression Should be able to login with right passcode', async ({ page }) => {
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

    test('@regression Should able to login with new email account', async () => {
      const newUserEmail = 'hellenzhu2@2925.com';
      await authPage.loginWithEmail(newUserEmail);
      
      // This step will fail as unable to bypass the cloudflare captcha
      // In UAT/DEV, may need developers to help bypass the captcha
      // await emailVerificationPage.assertOnPage(newUserEmail);
      
      // await emailVerificationPage.enterVerificationCode('123456');

       // Assume the login is successful and the user is redirected to the dashboard
      // await expect(page).toHaveURL('/dashboard');
    });

    test('@regression Should be able to login with right passcode', async () => {
      const existingUserEmail = 'hellenzhu@2925.com';
      await authPage.loginWithEmail(existingUserEmail);
      await emailVerificationPage.assertOnPage(existingUserEmail);
      await emailVerificationPage.enterVerificationCode('123456');

      // Assume the login is successful and the user is redirected to the dashboard
      // await expect(page).toHaveURL('/dashboard');
    });

    test('@regression Should be unable to login with wrong passcode', async () => {
      const existingUserEmail = 'hellenzhu@2925.com';
      await authPage.loginWithEmail(existingUserEmail);
      await emailVerificationPage.assertOnPage(existingUserEmail);
      await emailVerificationPage.enterVerificationCode('000000');
      await emailVerificationPage.assertWrongCodeErrorVisible();
    });
  });
});
