import { tradePortalTest } from './trade-portal.fixtures';
import { TradeDetailPage } from '../pom/pages/trade-detail/trade-detail.page';
import { NewTradePage } from '../pom/pages/new-trade/new-trade.page';
import { TradeFlow } from '../pom/flows/trade.flow';
import { TradeApi } from '../api/trade.api';
import { caseIdFromTitle } from '../utils/case-data';
import { getCreateTradeCase, type CreateTradeCase } from '../utils/trade-cases';

/** 交易域产生的跨步骤数据键（declaration merging 注入基座的 ScenarioData） */
declare module './base.fixtures' {
  interface ScenarioData {
    /** maker 创建交易后从接口响应捕获的 tradeId */
    tradeId: string;
    /** 本场景实际使用的建仓用例（tag 或 productType 解析），供验证步骤读取 */
    tradeCase: CreateTradeCase;
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
  /** 交易造数客户端（multipart 建仓，前置 Given 使用） */
  tradeApi: TradeApi;
  /** 本场景的建仓用例数据：从场景标题（`<caseId> - 描述`）解析，创建与验证步骤共用 */
  tradeCase: CreateTradeCase;
};

export const test = tradePortalTest.extend<TradeFixtures>({
  tradeDetailPage: async ({ page }, use) => use(new TradeDetailPage(page)),
  newTradePage: async ({ page }, use) => use(new NewTradePage(page)),
  tradeFlow: async ({ tradePortalPage, newTradePage }, use) =>
    use(new TradeFlow(tradePortalPage, newTradePage)),
  tradeApi: async ({ apiContext }, use) => use(new TradeApi(apiContext)),
  /* 懒加载：只有解构了 tradeCase 的测试才要求标题带 caseId */
  tradeCase: async ({}, use, testInfo) =>
    use(getCreateTradeCase(caseIdFromTitle(testInfo.title))),
});
