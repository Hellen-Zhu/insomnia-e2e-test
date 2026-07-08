import { createBdd } from 'playwright-bdd';
import { baseTest } from './base.fixtures';
import { LoginPage } from '../pages/login.page';
import { TradePortalPage } from '../pages/trade-portal/trade-portal.page';

/**
 * 登录域 fixtures：登录页 + 落地页（trade portal）。
 * TradePortalPage 在 trade 域也有注册——星型规则下 login 场景
 * 不能用 trade 域的 fixture，落地断言属于登录域自己的职责。
 */
type LoginFixtures = {
  loginPage: LoginPage;
  tradePortalPage: TradePortalPage;
};

export const test = baseTest.extend<LoginFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  tradePortalPage: async ({ page }, use) => use(new TradePortalPage(page)),
});

export const { Given, When, Then } = createBdd(test);
