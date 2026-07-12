import { credentialsFor } from '../../config/users';
import { Given, When, Then } from '../../fixtures/trade-portal.fixtures';

/**
 * 登录 UI 本身的功能测试用细粒度步骤（打开→提交→逐项断言）。
 * 业务场景的登录前置请用 `Given the "<role>" is logged in`（auth.steps.ts，
 * 走 LoginFlow：UI 登录 + 等落地页就绪）。
 * 主语用 the user（匿名操作者）：登录功能测的是"任何人来登录"，不预设角色。
 */
Given('the user is on the login page', async ({ loginPage }) => {
  await loginPage.open();
});

When('the user logs in as {string}', async ({ loginPage }, role: string) => {
  const { username, password } = credentialsFor(role);
  await loginPage.login(username, password);
});

When(
  'the user logs in with username {string} and password {string}',
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.login(username, password);
  },
);

Then('the error message {string} is shown', async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});
