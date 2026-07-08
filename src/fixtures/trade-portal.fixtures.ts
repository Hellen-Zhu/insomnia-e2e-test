import { createBdd } from 'playwright-bdd';
import { baseTest } from './base.fixtures';
import { TradePortalPage } from '../pages/trade-portal/trade-portal.page';

/**
 * Trade portal 层：全应用的落地页/主页面。
 * login 域（登录后落地断言）和 trade 域（业务操作入口）都依赖它，
 * 因此不放在任一兄弟域，而是作为两者的公共祖先：
 *
 *   base → tradePortal → { login, trade }
 *
 * 它注册的步骤（见 steps/trade-portal.steps.ts）对两个域的场景都可用。
 */
type TradePortalFixtures = {
  tradePortalPage: TradePortalPage;
};

export const tradePortalTest = baseTest.extend<TradePortalFixtures>({
  tradePortalPage: async ({ page }, use) => use(new TradePortalPage(page)),
});

export const { Given, When, Then } = createBdd(tradePortalTest);
