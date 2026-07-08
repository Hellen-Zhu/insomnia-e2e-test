import { env } from '../config/env';
import { Given, When, Then } from '../fixtures/login.fixtures';

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.open();
});

When('I login with valid credentials', async ({ loginPage }) => {
  await loginPage.login(env.username, env.password);
});

When(
  'I login with username {string} and password {string}',
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.login(username, password);
  },
);

Then('I should see the products page', async ({ inventoryPage }) => {
  await inventoryPage.expectOpened();
});

Then('I should see the error message {string}', async ({ loginPage }, message: string) => {
  await loginPage.expectError(message);
});
