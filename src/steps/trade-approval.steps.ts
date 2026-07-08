import type { DataTable } from 'playwright-bdd';
import type { NewTradeRequest } from '../flows/trade.flow';
import { Given, When, Then } from '../fixtures/trade.fixtures';

/** 登录前置用基座步骤 `Given I am logged in as "<role>"`，此步只负责到达 */
Given('I am on the trade portal', async ({ tradePortalPage }) => {
  await tradePortalPage.open();
  await tradePortalPage.expectOpened();
});

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

/** 切到 checker 角色后回到 portal——同一浏览器会话，ctx 里的 tradeId 继续可用 */
When('the checker approves the trade', async ({ loginAs, tradePortalPage, tradeFlow, ctx }) => {
  await loginAs('checker');
  await tradePortalPage.open();
  await tradePortalPage.expectOpened();
  await tradeFlow.approveTrade(ctx.require('tradeId'));
});

Then(
  'the trade should show event status {string}',
  async ({ tradeFlow, ctx }, eventStatus: string) => {
    const row = await tradeFlow.findTradeRow(ctx.require('tradeId'));
    await row.expectContains(eventStatus);
  },
);
