import { credentialsFor } from '../config/users';
import { Given, When, Then } from '../fixtures/trade-portal.fixtures';

/**
 * 登录 UI 本身的功能测试用细粒度步骤（打开→提交→逐项断言）。
 * 业务场景的登录前置请用 `Given I am logged in as "<role>"`（auth.steps.ts，
 * 走 LoginFlow：UI 登录 + 等落地页就绪）。
 */
Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.open();
});

When('I login as {string}', async ({ loginPage }, role: string) => {
  const { username, password } = credentialsFor(role);
  await loginPage.login(username, password);
});

When(
  'I login with username {string} and password {string}',
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.login(username, password);
  },
);

Then('I should see the error message {string}', async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});
