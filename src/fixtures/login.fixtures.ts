import { createBdd } from 'playwright-bdd';
import { baseTest } from './base.fixtures';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { LoginFlow } from '../flows/login.flow';

/** 登录域 fixtures：登录页 + 落地页 + 登录流程 */
type LoginFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  loginFlow: LoginFlow;
};

export const test = baseTest.extend<LoginFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  loginFlow: async ({ loginPage, inventoryPage }, use) =>
    use(new LoginFlow(loginPage, inventoryPage)),
});

export const { Given, When, Then } = createBdd(test);
