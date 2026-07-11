import { test } from '../src/fixtures/trade.fixtures';
import { assertProductType, type CreateTradeCase } from '../src/utils/trade-cases';
import type { TradeFlow } from '../src/pom/flows/trade.flow';

/**
 * 建仓（数据驱动）：用例参数按模块放在 test-data/trades/create-trade-cases.yaml，
 * 测试经标题约定 "<caseId> - <业务描述>" 绑定自己的 case（tradeCase fixture 解析标题）。
 * 每个 case 标题各自描述业务行为，报告读到的是不同行为而非同一描述重复 N 遍。
 */

type CreateTradeFixtures = {
  tradeFlow: TradeFlow;
  tradeCase: CreateTradeCase;
};

/**
 * 全部建仓测试共用的步骤序列：UI 创建 → 状态断言 → 数据回验。
 * 差异全部在 caseId 绑定的数据里（counterparty/portfolio/stepIn），步骤文本不变。
 * step 标题遵循 docs/gherkin-style.md 的业务语言规范（BDD 分支同规范源）：
 * "is pending approval" 是封闭的业务状态短语（New + pending approval + 已入
 * blotter 三件事一次断言，不拆分——它们创建后总是同时成立）。
 * tradeId 经 test.step 返回值 + 闭包在步骤间流动，验证步骤与创建步骤共用
 * 同一个 tradeCase——断言用的期望值与输入同源。
 */
async function createTradeFromCaseDataAndVerify(
  { tradeFlow, tradeCase }: CreateTradeFixtures,
  productType: string,
  subject = 'new',
): Promise<void> {
  const tradeId = await test.step(
    `When the maker creates a "${productType}" trade from the case data`,
    () => tradeFlow.createTrade(assertProductType(productType), tradeCase),
  );
  await test.step(`Then the ${subject} trade is pending approval`, async () => {
    const row = await tradeFlow.findTradeRow(tradeId);
    await row.expectContains(tradeId, 'New', 'pending approval');
  });
  await test.step('And the trade row matches the case data', async () => {
    const row = await tradeFlow.findTradeRow(tradeId);
    await row.expectContains(tradeCase.counterparty);
  });
}

test.describe('Create trade (data-driven)', { tag: '@trade' }, () => {
  /* Background：maker 登录（LoginFlow 末尾等落地页就绪）→ 直达 trade portal */
  test.beforeEach(async ({ loginFlow, tradePortalPage }) => {
    await test.step('Given the "maker" is logged in', async () => {
      await loginFlow.loginAs('maker');
    });
    await test.step('And the user is on the trade portal', async () => {
      await tradePortalPage.open();
      await tradePortalPage.expectOpened();
    });
  });

  /* Scenario Outline 的原生等价物：productType 是业务可见的差异轴，进表；
   * 每行的 counterparty/portfolio 各自来自该行 caseId 对应的 case 数据，
   * 可以相同也可以不同——表只要求 caseId 逐行不同，保证标题可追溯、报告不去重 */
  const plainTrades = [
    { caseId: 'TRADE-001', productType: 'FX_TRF' },
    { caseId: 'TRADE-002', productType: 'FX_CO' },
    { caseId: 'TRADE-003', productType: 'FX_FBS' },
  ] as const;
  for (const { caseId, productType } of plainTrades) {
    test(`${caseId} - Create a plain ${productType} trade`, async ({ tradeFlow, tradeCase }) => {
      await createTradeFromCaseDataAndVerify({ tradeFlow, tradeCase }, productType);
    });
  }

  /* step-in 是独立于产品类型的流程分支，固定用 FX_FBS 各测一个模式，不进上面的表 */
  test('TRADE-004 - Create an FX FBS trade with a full step-in', async ({ tradeFlow, tradeCase }) => {
    await createTradeFromCaseDataAndVerify({ tradeFlow, tradeCase }, 'FX_FBS', 'full step-in');
  });

  test('TRADE-005 - Create an FX FBS trade with a partial step-in', async ({ tradeFlow, tradeCase }) => {
    await createTradeFromCaseDataAndVerify({ tradeFlow, tradeCase }, 'FX_FBS', 'partial step-in');
  });
});
