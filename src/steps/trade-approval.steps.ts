import type { DataTable } from 'playwright-bdd';
import type { NewTradeRequest } from '../flows/trade.flow';
import { When, Then } from '../fixtures/trade.fixtures';

When('the maker creates a new trade:', async ({ tradeFlow, ctx }, table: DataTable) => {
  const request = table.rowsHash() as unknown as NewTradeRequest;
  ctx.set('tradeId', await tradeFlow.createTrade(request));
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
