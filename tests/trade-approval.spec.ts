import { test } from '../src/fixtures/trade.fixtures';
import type { TradeApi } from '../src/api/trade.api';
import type { TradeFlow } from '../src/pom/flows/trade.flow';
import { credentialsFor } from '../src/config/users';
import { assertProductType, type CreateTradeCase } from '../src/utils/trade-cases';
import { getPreset } from '../src/utils/case-data';

/**
 * maker-checker 审批/拒绝：审批动作才是被测行为，建仓只是前置——
 * 用 preset（业务别名，与 caseId 无关）走 API 造数，不占浏览器、不依赖登录态。
 * 角色在同一浏览器会话内切换（清 cookie → checker 重新登录），
 * 运行时数据（tradeId）经 helper 返回值 + 闭包在步骤间流动。
 *
 * step 标题遵循 docs/gherkin-style.md 的业务语言规范（BDD 分支同规范源）：
 * 第三人称具名角色、Then 用陈述句、状态用封闭短语而非列值参数。
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
      getPreset<CreateTradeCase>('trade_preset', presetName),
      credentialsFor('maker').username,
    ));
}

/**
 * 审批结果断言：approve 批的是 pending 事件，交易状态取决于事件类型——
 * 建仓获批 → New，取消获批 → Cancelled，修改获批 → Amended。
 * status 参数锁定业务状态词汇（受限集合），列值映射只在这里。
 */
const STATUS_BY_PHRASE = { new: 'New', cancelled: 'Cancelled', amended: 'Amended' } as const;

async function thenTradeIsApprovedAndMarkedAs(
  tradeFlow: TradeFlow,
  tradeId: string,
  status: keyof typeof STATUS_BY_PHRASE,
): Promise<void> {
  await test.step(`Then the trade is approved and marked as ${status}`, async () => {
    const row = await tradeFlow.findTradeRow(tradeId);
    await row.expectContains(STATUS_BY_PHRASE[status], 'Approved');
  });
}

/**
 * 拒绝结果暂只断言事件维度（Rejected）：拒绝后交易状态列的行为（建仓被拒后
 * 仍是 New？取消被拒后回到原状态？）待真实应用确认后，再升级为与 approve
 * 对称的二维短语。
 */
async function thenTradeIsRejected(tradeFlow: TradeFlow, tradeId: string): Promise<void> {
  await test.step('Then the trade is rejected', async () => {
    const row = await tradeFlow.findTradeRow(tradeId);
    await row.expectContains('Rejected');
  });
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
    await thenTradeIsApprovedAndMarkedAs(tradeFlow, tradeId, 'new');
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
    await thenTradeIsRejected(tradeFlow, tradeId);
  });
});
