import { createBdd } from 'playwright-bdd';
import { tradePortalTest } from './trade-portal.fixtures';
import { LoginPage } from '../pages/login.page';

/**
 * 登录域 fixtures：登录页。
 * 从 tradePortalTest 继承——登录成功的落地断言（trade portal）
 * 由 trade-portal 层的步骤提供，本域无需重复注册。
 */
type LoginFixtures = {
  loginPage: LoginPage;
};

export const test = tradePortalTest.extend<LoginFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
});

export const { Given, When, Then } = createBdd(test);
