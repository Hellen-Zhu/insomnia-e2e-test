import { test } from '../src/fixtures/trade.fixtures';
import type { TradeApi } from '../src/api/trade.api';
import { credentialsFor } from '../src/config/users';
import { assertProductType, getTradePreset } from '../src/utils/trade-cases';

/**
 * maker-checker 审批/拒绝：审批动作才是被测行为，建仓只是前置——
 * 用 preset（业务别名，与 caseId 无关）走 API 造数，不占浏览器、不依赖登录态。
 * 角色在同一浏览器会话内切换（清 cookie → checker 重新登录），
 * 运行时数据（tradeId）经 helper 返回值 + 闭包在步骤间流动。
 */

/**
 * 前置造数：presets 是小而稳定的枚举集合（standard / stepin-full / stepin-partial），
 * step 标题把 preset 语义写成自然语言，不把 YAML key 暴露进报告文本。
 * test.step 会透传回调的返回值，tradeId 由调用方接住。
 */
async function givenTradeCreatedViaApi(
  { tradeApi }: { tradeApi: TradeApi },
  productType: string,
  presetName = 'standard',
): Promise<string> {
  return test.step(`Given a "${productType}" trade has been created via api`, () =>
    tradeApi.createTrade(
      assertProductType(productType),
      getTradePreset(presetName),
      credentialsFor('maker').username,
    ));
}

test.describe('Trade maker-checker approval', { tag: '@trade' }, () => {
  test('TRADE-101 - Checker approves a pending trade', async ({
    tradeApi,
    context,
    loginFlow,
    tradeFlow,
  }) => {
    const tradeId = await givenTradeCreatedViaApi({ tradeApi }, 'FX_TRF');
    await test.step('When the checker approves the trade', async () => {
      await context.clearCookies();
      await loginFlow.loginAs('checker');
      await tradeFlow.approveTrade(tradeId);
    });
    await test.step('Then the trade should show event status "Approved"', async () => {
      const row = await tradeFlow.findTradeRow(tradeId);
      await row.expectContains('Approved');
    });
  });

  test('TRADE-102 - Checker rejects a pending trade', async ({
    tradeApi,
    context,
    loginFlow,
    tradeFlow,
  }) => {
    const tradeId = await givenTradeCreatedViaApi({ tradeApi }, 'FX_TRF');
    await test.step('When the checker rejects the trade', async () => {
      await context.clearCookies();
      await loginFlow.loginAs('checker');
      await tradeFlow.rejectTrade(tradeId);
    });
    await test.step('Then the trade should show event status "Rejected"', async () => {
      const row = await tradeFlow.findTradeRow(tradeId);
      await row.expectContains('Rejected');
    });
  });
});
