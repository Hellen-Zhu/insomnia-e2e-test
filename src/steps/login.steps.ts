import { credentialsFor } from '../config/users';
import { Given, When, Then } from '../fixtures/login.fixtures';

/**
 * 登录 UI 本身的功能测试：走真实表单提交。
 * 其他场景的登录前置请用基座步骤 `Given I am logged in as "<role>"`（会话注入）。
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

Then('I should be logged in', async ({ loginPage }) => {
  await loginPage.expectLoginSucceeded();
});

Then('I should see the error message {string}', async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});
