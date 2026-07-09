import { getDefaultTradeCase } from '../utils/trade-cases';
import { When, Then } from '../fixtures/trade.fixtures';

/** 用例数据来自场景的 @case:<id> tag（tradeCase fixture），步骤文本不出现 caseId */
When('the maker creates a trade from the case data', async ({ tradeFlow, tradeCase, ctx }) => {
  ctx.set('tradeCase', tradeCase);
  ctx.set('tradeId', await tradeFlow.createTrade(tradeCase));
});

/** Scenario Outline 用：Examples 列只出现 productType，按 defaults 映射取默认用例 */
When(
  'the maker creates a {string} trade using default case data',
  async ({ tradeFlow, ctx }, productType: string) => {
    const tradeCase = getDefaultTradeCase(productType);
    ctx.set('tradeCase', tradeCase);
    ctx.set('tradeId', await tradeFlow.createTrade(tradeCase));
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
