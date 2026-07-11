import type { TradeApi } from '../api/trade.api';
import type { ScenarioContext } from '../fixtures/base.fixtures';
import { credentialsFor } from '../config/users';
import { assertProductType, type CreateTradeCase } from '../utils/trade-cases';
import { getPreset } from '../utils/case-data';
import { Given, When, Then } from '../fixtures/trade.fixtures';

/**
 * 前置造数：建仓不是被测行为时使用，数据来自 presets（业务别名，与 caseId 无关）。
 * 走 API（multipart 上传，X-User-Id 为 maker）——不占浏览器、不依赖登录态。
 *
 * presets 是一个小而稳定的枚举集合（目前只有三种形态），不像 cases 会随覆盖率持续
 * 增长，所以这里换成一个 Given 对应一种自然语言短语，而不是把 preset 的 YAML key
 * （如 "stepin-partial"）当参数塞进引号——避免内部命名直接出现在 Gherkin 文本里。
 * 加第四种形态 = 加一行 YAML preset + 一个新 Given，量级上仍然可控。
 */
async function seedTradeWithPreset(
  { tradeApi, ctx }: { tradeApi: TradeApi; ctx: ScenarioContext },
  productType: string,
  presetName: string,
): Promise<void> {
  const type = assertProductType(productType);
  const preset = getPreset<CreateTradeCase>('trade_preset', presetName);
  ctx.set('tradeCase', preset);
  ctx.set('tradeId', await tradeApi.createTrade(type, preset, credentialsFor('maker').username));
}

// 注意：playwright-bdd 静态解析步骤函数的首参数拿使用了哪些 fixture，
// 因此这里必须逐个字面量解构 { tradeApi, ctx }，不能转发一个 fixtures 变量。
Given('a {string} trade has been created via api', ({ tradeApi, ctx }, productType: string) =>
  seedTradeWithPreset({ tradeApi, ctx }, productType, 'standard'),
);

Given(
  'a {string} trade has been created with a full step-in via api',
  ({ tradeApi, ctx }, productType: string) =>
    seedTradeWithPreset({ tradeApi, ctx }, productType, 'stepin-full'),
);

Given(
  'a {string} trade has been created with a partial step-in via api',
  ({ tradeApi, ctx }, productType: string) =>
    seedTradeWithPreset({ tradeApi, ctx }, productType, 'stepin-partial'),
);

/**
 * 被测的建仓：productType 在步骤中声明（固定枚举，绑定 .dat 路径）；
 * 可变参数（counterparty/portfolio/stepIn）经标题 caseId 从 YAML 取（tradeCase fixture）
 */
When(
  'the maker creates a {string} trade from the case data',
  async ({ tradeFlow, tradeCase, ctx }, productType: string) => {
    ctx.set('tradeCase', tradeCase);
    ctx.set('tradeId', await tradeFlow.createTrade(assertProductType(productType), tradeCase));
  },
);

/** 验证点同样消费用例数据（从 ctx 读，与数据来自 tag 还是 productType 无关） */
Then('the trade row matches the case data', async ({ tradeFlow, ctx }) => {
  const tradeCase = ctx.require('tradeCase');
  const row = await tradeFlow.findTradeRow(ctx.require('tradeId'));
  await row.expectContains(tradeCase.counterparty);
});

/**
 * 业务状态断言：与 preset Given 同一设计——状态是小而稳定的枚举，一种业务状态
 * 一个自然语言短语，具体列值封装在这里，不当参数暴露进 Gherkin。
 * "pending approval" = 创建后的完整已知状态：行已出现在 blotter（live）+
 * status "New"（marked as new）+ event status "pending approval"。
 * 主语变体（new / full step-in / partial step-in）是纯装饰，让场景读起来自然，
 * 不参与断言逻辑；新增业务状态时在此登记新短语。
 */
Then(
  /^the (?:new |full step-in |partial step-in )?trade is pending approval$/,
  async ({ tradeFlow, ctx }) => {
    const tradeId = ctx.require('tradeId');
    const row = await tradeFlow.findTradeRow(tradeId);
    await row.expectContains(tradeId, 'New', 'pending approval');
  },
);

/** 切到 checker 角色（清 cookie 重新登录，落地即在 portal）——ctx 里的 tradeId 继续可用 */
When('the checker approves the trade', async ({ context, loginFlow, tradeFlow, ctx }) => {
  await context.clearCookies();
  await loginFlow.loginAs('checker');
  await tradeFlow.approveTrade(ctx.require('tradeId'));
});

When('the checker rejects the trade', async ({ context, loginFlow, tradeFlow, ctx }) => {
  await context.clearCookies();
  await loginFlow.loginAs('checker');
  await tradeFlow.rejectTrade(ctx.require('tradeId'));
});

/**
 * 审批结果断言：approve 批的是 pending 事件，交易状态取决于事件类型——
 * 建仓获批 → New，取消获批 → Cancelled，修改获批 → Amended。
 * 短语同时锁定两个维度（事件裁决 × 交易状态），受限选择集之外的写法直接
 * undefined step；列值映射只在这里（真机确认后如大小写有出入在此调整）。
 */
const STATUS_BY_PHRASE = { new: 'New', cancelled: 'Cancelled', amended: 'Amended' } as const;

Then(
  /^the trade is approved and marked as (new|cancelled|amended)$/,
  async ({ tradeFlow, ctx }, status: string) => {
    const row = await tradeFlow.findTradeRow(ctx.require('tradeId'));
    await row.expectContains(STATUS_BY_PHRASE[status as keyof typeof STATUS_BY_PHRASE], 'Approved');
  },
);

/**
 * 拒绝结果暂只断言事件维度（Rejected）：拒绝后交易状态列的行为（建仓被拒后
 * 仍是 New？取消被拒后回到原状态？）待真实应用确认后，再升级为与 approve
 * 对称的二维短语。
 */
Then('the trade is rejected', async ({ tradeFlow, ctx }) => {
  const row = await tradeFlow.findTradeRow(ctx.require('tradeId'));
  await row.expectContains('Rejected');
});
