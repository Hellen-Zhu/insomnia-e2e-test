import { baseTest } from './base.fixtures';
import { LoginPage } from '../pom/pages/login.page';
import { TradePortalPage } from '../pom/pages/trade-portal/trade-portal.page';
import { LoginFlow } from '../pom/flows/login.flow';

/**
 * 应用入口层：登录页 + trade portal（落地页）+ UI 登录流程。
 * 所有业务域从这里 extend（base → tradePortal → { trade, product, ... }），
 * 本层提供的能力（登录流程、落地断言）对全部业务域的 spec 可用。
 *
 * 登录目前只有 UI 一条通道（应用暂不支持会话注入/缓存），每次都真实登录；
 * 将来支持后在 LoginFlow 或此处收口，步骤文本不变。
 */
type TradePortalFixtures = {
  loginPage: LoginPage;
  tradePortalPage: TradePortalPage;
  loginFlow: LoginFlow;
};

export const tradePortalTest = baseTest.extend<TradePortalFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  tradePortalPage: async ({ page }, use) => use(new TradePortalPage(page)),
  loginFlow: async ({ loginPage, tradePortalPage }, use) =>
    use(new LoginFlow(loginPage, tradePortalPage)),
});
