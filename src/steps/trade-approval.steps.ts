import type { TradeApi } from '../api/trade.api';
import type { ScenarioContext } from '../fixtures/base.fixtures';
import { credentialsFor } from '../config/users';
import { assertProductType, getTradePreset } from '../utils/trade-cases';
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
  const preset = getTradePreset(presetName);
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
