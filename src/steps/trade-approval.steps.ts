import { assertProductType, getDefaultTradeCase } from '../utils/trade-cases';
import { When, Then } from '../fixtures/trade.fixtures';

/**
 * productType 在步骤中声明（固定枚举，绑定 .dat 路径）；
 * 可变参数（counterparty/portfolio/stepIn）经标题 caseId 从 YAML 取（tradeCase fixture）
 */
When(
  'the maker creates a {string} trade from the case data',
  async ({ tradeFlow, tradeCase, ctx }, productType: string) => {
    ctx.set('tradeCase', tradeCase);
    ctx.set('tradeId', await tradeFlow.createTrade(assertProductType(productType), tradeCase));
  },
);

/** Scenario Outline 用：按 defaults 映射（productType → 默认 caseId）取用例参数 */
When(
  'the maker creates a {string} trade using default case data',
  async ({ tradeFlow, ctx }, productType: string) => {
    const type = assertProductType(productType);
    const tradeCase = getDefaultTradeCase(type);
    ctx.set('tradeCase', tradeCase);
    ctx.set('tradeId', await tradeFlow.createTrade(type, tradeCase));
  },
);

/** 验证点同样消费用例数据（从 ctx 读，与数据来自 tag 还是 productType 无关） */
Then('the trade row should match the case data', async ({ tradeFlow, ctx }) => {
  const tradeCase = ctx.require('tradeCase');
  const row = await tradeFlow.findTradeRow(ctx.require('tradeId'));
  await row.expectContains(tradeCase.counterparty);
});

Then(
  'the new trade should appear with status {string} and event status {string}',
  async ({ tradeFlow, ctx }, status: string, eventStatus: string) => {
    const tradeId = ctx.require('tradeId');
    const row = await tradeFlow.findTradeRow(tradeId);
    await row.expectContains(tradeId, status, eventStatus);
  },
);

/** 切到 checker 角色（清 cookie 重新登录，落地即在 portal）——ctx 里的 tradeId 继续可用 */
When('the checker approves the trade', async ({ context, loginFlow, tradeFlow, ctx }) => {
  await context.clearCookies();
  await loginFlow.loginAs('checker');
  await tradeFlow.approveTrade(ctx.require('tradeId'));
});

Then(
  'the trade should show event status {string}',
  async ({ tradeFlow, ctx }, eventStatus: string) => {
    const row = await tradeFlow.findTradeRow(ctx.require('tradeId'));
    await row.expectContains(eventStatus);
  },
);
