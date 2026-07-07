import { env } from '../config/env';
import { Given, When, Then } from './fixtures';

Given('我打开登录页', async ({ loginPage }) => {
  await loginPage.open();
});

When('我使用有效凭证登录', async ({ loginPage }) => {
  await loginPage.login(env.username, env.password);
});

When('我使用用户名 {string} 和密码 {string} 登录', async ({ loginPage }, username: string, password: string) => {
  await loginPage.login(username, password);
});

Then('我应该看到商品列表页', async ({ inventoryPage }) => {
  await inventoryPage.expectOpened();
});

Then('我应该看到错误提示 {string}', async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});
