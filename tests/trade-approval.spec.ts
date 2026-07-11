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
 * 审批/拒绝结果断言：approve 与 reject 都是对 pending 事件的裁决，交易状态
 * 取决于事件类型——建仓 → New，取消 → Cancelled，修改 → Amended。两个裁决
 * 共用同一张状态映射表，verdict 参数锁定业务状态词汇（受限集合），列值映射
 * 只在这里。
 *
 * 当前只有 TRADE-102（建仓被拒）验证过 reject 侧，因此只确认了 new 这一条：
 * 拒绝后交易仍显示 New（创建本身没有被撤销，只是没能获批）。取消/修改被拒后
 * 状态是否也是"维持原样"（而非套用 cancelled/amended）待真实应用补齐对应
 * 场景后再验证——不要在没有测试覆盖前假设三个值在 reject 侧同样成立。
 */
const STATUS_BY_PHRASE = { new: 'New', cancelled: 'Cancelled', amended: 'Amended' } as const;

async function thenTradeIsVerdictAndMarkedAs(
  tradeFlow: TradeFlow,
  tradeId: string,
  verdict: 'approved' | 'rejected',
  status: keyof typeof STATUS_BY_PHRASE,
): Promise<void> {
  await test.step(`Then the trade is ${verdict} and marked as ${status}`, async () => {
    const row = await tradeFlow.findTradeRow(tradeId);
    const eventStatus = verdict === 'approved' ? 'Approved' : 'Rejected';
    await row.expectContains(STATUS_BY_PHRASE[status], eventStatus);
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
    await thenTradeIsVerdictAndMarkedAs(tradeFlow, tradeId, 'approved', 'new');
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
    await thenTradeIsVerdictAndMarkedAs(tradeFlow, tradeId, 'rejected', 'new');
  });
});
