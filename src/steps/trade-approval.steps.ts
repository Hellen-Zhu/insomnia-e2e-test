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

/**
 * checker 裁决（清 cookie 重新登录切角色——ctx 里的 tradeId 继续可用）。
 * 入口是封闭选择集（机制限定语，见 docs/gherkin-style.md）：
 *   blotter            = 行菜单 approve/reject + CheckerActionDialog
 *   trade details page = view-details 进详情页 + 页内按钮 + 页内确认弹窗
 * 两条 UI 布线完全独立（不同按钮、不同弹窗组件），各自值得覆盖；
 * 业务结果与入口无关，Then 短语两条链路共用。
 */
When(
  /^the checker (approves|rejects) the trade from the (blotter|trade details page)$/,
  async ({ context, loginFlow, tradeFlow, ctx }, verdict: string, entry: string) => {
    await context.clearCookies();
    await loginFlow.loginAs('checker');
    const tradeId = ctx.require('tradeId');
    const fromDetails = entry === 'trade details page';
    if (verdict === 'approves') {
      await (fromDetails ? tradeFlow.approveTradeFromDetails(tradeId) : tradeFlow.approveTrade(tradeId));
    } else {
      await (fromDetails ? tradeFlow.rejectTradeFromDetails(tradeId) : tradeFlow.rejectTrade(tradeId));
    }
  },
);

/**
 * 审批/拒绝结果断言：approve 与 reject 都是对 pending 事件的裁决，交易状态
 * 取决于事件类型——建仓 → New，取消 → Cancelled，修改 → Amended。两个裁决
 * 共用同一张状态映射表，短语同时锁定两个维度（事件裁决 × 交易状态），受限
 * 选择集之外的写法直接 undefined step；列值映射只在这里（真机确认后如大小写
 * 有出入在此调整）。
 *
 * 当前只有 TRADE-102（建仓被拒）验证过 reject 侧，因此只确认了 new 这一条：
 * 拒绝后交易仍显示 New（创建本身没有被撤销，只是没能获批）。取消/修改被拒后
 * 状态是否也是"维持原样"（而非套用 cancelled/amended）待真实应用补齐对应
 * 场景后再验证——不要在没有测试覆盖前假设三个值在 reject 侧同样成立。
 */
const STATUS_BY_PHRASE = { new: 'New', cancelled: 'Cancelled', amended: 'Amended' } as const;

Then(
  /^the trade is (approved|rejected) and marked as (new|cancelled|amended)$/,
  async ({ tradeFlow, ctx }, verdict: string, status: string) => {
    const row = await tradeFlow.findTradeRow(ctx.require('tradeId'));
    const eventStatus = verdict === 'approved' ? 'Approved' : 'Rejected';
    await row.expectContains(STATUS_BY_PHRASE[status as keyof typeof STATUS_BY_PHRASE], eventStatus);
  },
);
