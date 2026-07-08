import { createBdd } from 'playwright-bdd';
import { baseTest } from './base.fixtures';
import { TradePortalPage } from '../pages/trade-portal/trade-portal.page';
import { TradeDetailPage } from '../pages/trade-detail/trade-detail.page';
import { NewTradePage } from '../pages/new-trade/new-trade.page';
import { TradeFlow } from '../flows/trade.flow';

/** 交易域产生的跨步骤数据键（declaration merging 注入基座的 ScenarioData） */
declare module './base.fixtures' {
  interface ScenarioData {
    /** maker 创建交易后从接口响应捕获的 tradeId */
    tradeId: string;
  }
}

/** 交易域 fixtures：portal / 详情 / 新建 三个页面 + 生命周期流程 */
type TradeFixtures = {
  tradePortalPage: TradePortalPage;
  tradeDetailPage: TradeDetailPage;
  newTradePage: NewTradePage;
  tradeFlow: TradeFlow;
};

export const test = baseTest.extend<TradeFixtures>({
  tradePortalPage: async ({ page }, use) => use(new TradePortalPage(page)),
  tradeDetailPage: async ({ page }, use) => use(new TradeDetailPage(page)),
  newTradePage: async ({ page }, use) => use(new NewTradePage(page)),
  tradeFlow: async ({ tradePortalPage, newTradePage }, use) =>
    use(new TradeFlow(tradePortalPage, newTradePage)),
});

export const { Given, When, Then } = createBdd(test);
