import type { DataTable } from 'playwright-bdd';
import type { NewTradeRequest } from '../flows/trade.flow';
import { Given, When, Then } from './fixtures';

/** maker/checker 的登录态由各自 RoleSession 的 context 预注入，直达即可 */
Given('the maker is on the trade portal', async ({ maker }) => {
  await maker.tradePortalPage.open();
  await maker.tradePortalPage.expectOpened();
});

When('the maker creates a new trade:', async ({ maker, ctx }, table: DataTable) => {
  const request = table.rowsHash() as unknown as NewTradeRequest;
  ctx.tradeId = await maker.tradeFlow.createTrade(request);
});

Then(
  'the new trade should appear with status {string} and event status {string}',
  async ({ maker, ctx }, status: string, eventStatus: string) => {
    const row = await maker.tradeFlow.findTradeRow(ctx.requireTradeId());
    await row.expectContains(ctx.requireTradeId(), status, eventStatus);
  },
);

When('the checker approves the trade', async ({ checker, ctx }) => {
  await checker.tradePortalPage.open();
  await checker.tradePortalPage.expectOpened();
  await checker.tradeFlow.approveTrade(ctx.requireTradeId());
});

Then('the trade should show event status {string}', async ({ checker, ctx }, eventStatus: string) => {
  const row = await checker.tradeFlow.findTradeRow(ctx.requireTradeId());
  await row.expectContains(eventStatus);
});
