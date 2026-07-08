import { createBdd } from 'playwright-bdd';
import { tradePortalTest } from './trade-portal.fixtures';
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

/**
 * 交易域 fixtures：详情 / 新建两个页面 + 生命周期流程。
 * 从 tradePortalTest 继承，tradePortalPage 由父层提供。
 */
type TradeFixtures = {
  tradeDetailPage: TradeDetailPage;
  newTradePage: NewTradePage;
  tradeFlow: TradeFlow;
};

export const test = tradePortalTest.extend<TradeFixtures>({
  tradeDetailPage: async ({ page }, use) => use(new TradeDetailPage(page)),
  newTradePage: async ({ page }, use) => use(new NewTradePage(page)),
  tradeFlow: async ({ tradePortalPage, newTradePage }, use) =>
    use(new TradeFlow(tradePortalPage, newTradePage)),
});

export const { Given, When, Then } = createBdd(test);
