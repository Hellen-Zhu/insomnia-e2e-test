# E2E 自动化测试框架

基于 **Playwright + TypeScript + Cucumber（playwright-bdd）** 的端到端自动化测试框架，页面层采用 **POM（Page Object Model）** 模式。示例基于公开演示站 [saucedemo.com](https://www.saucedemo.com)，开箱即可运行。

## 架构

```
features/*.feature (Gherkin, 业务可读)
        ↓ bddgen 编译
.features-gen/ (Playwright 原生测试, 自动生成, git 忽略)
        ↓
Playwright Test Runner (并行 / 重试 / trace)
        ↓
双报告: Playwright HTML(工程师) + Cucumber HTML(业务方)
```

## 快速开始

```bash
npm install
npx playwright install chromium
npm test                # 运行全部测试（dev 环境）
npm run test:smoke      # 只跑 @smoke 标签
npm run test:headed     # 有头模式，观察浏览器执行
npm run test:ui         # Playwright UI 模式，调试利器
npm run report          # 打开 HTML 报告
ENV=staging npm test    # 切换环境
```

## 目录结构与分层约定

```
├── features/           # 特性层：Gherkin 场景（业务语言）
├── src/
│   ├── pom/            # UI 模型层：唯一允许出现 Locator 的地方
│   │   ├── flows/      #   流程层：跨页面业务流程编排（登录、下单）
│   │   ├── pages/      #   页面层：POM，封装定位器与页面行为
│   │   └── components/ #   组件层：设计系统组件对象（宿主→内部元素的映射）
│   ├── steps/          # 步骤层：Gherkin ↔ flow/page 的薄胶水
│   ├── fixtures/       # DI 中心：base（横切）+ 各业务域一个文件
│   └── config/         # 配置层：环境相关配置（随 ENV 变化）
├── test-data/          # 外部测试数据（JSON），Gherkin 中以业务别名引用
├── env/                # 各环境变量文件 (.env.dev / .env.staging ...)
├── playwright.config.ts
└── .github/workflows/  # CI
```

**分层纪律（可维护性的关键）——依赖只允许向下：**

| 层 | 职责 | 可以调用 | 禁止 |
|---|---|---|---|
| `features/` | 纯业务语言描述场景 | — | 选择器、URL 等技术细节 |
| `src/steps/` | 一行 Gherkin ↔ 一次调用 | flow、page | component、Playwright 原语、业务逻辑 |
| `src/pom/flows/` | 跨页面业务流程编排 + 到达断言 | page | 持有定位器、感知 Gherkin |
| `src/pom/pages/` | 定位器 + 单页行为 + 页面级断言 | component、原语 | 其他 page、感知 Gherkin |
| `src/pom/components/` | 设计系统组件（宿主→内部） | 原语 | page、flow |

**step 调 flow 还是 page？** 这行 Gherkin 跨页面（`the maker creates a new trade`）→ flow；单页动作（`the maker is on the trade portal`）→ page。

## 如何扩展

### 新增一个页面对象

1. 在 `src/pom/pages/` 创建类，继承 `BasePage`：

```ts
export class ProfilePage extends BasePage {
  readonly path = '/profile.html';
  private readonly saveButton = this.page.locator('[data-test="save"]');

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}
```

2. 在所属业务域的 fixtures 文件（`src/fixtures/<domain>.fixtures.ts`）注册一行：

```ts
profilePage: async ({ page }, use) => use(new ProfilePage(page)),
```

新业务域则新建 `<domain>.fixtures.ts`：从 `baseTest` extend 并导出
`createBdd(test)` 的 Given/When/Then，该域的 steps 从这里导入。
约束（playwright-bdd）：**一个 scenario 的步骤必须来自同一个 test 实例
或其祖先**——领域之间不要互相 extend；多个域共享的页面/步骤提升为
公共祖先层。当前继承链：base → tradePortal（应用入口：登录页 + portal
+ LoginFlow）→ { trade, product }，登录/落地步骤对全部业务场景可用。

### 新增一个场景

1. 在 `features/` 写 Gherkin 场景（优先复用已有步骤；措辞遵循
   [docs/gherkin-style.md](docs/gherkin-style.md) 的六条规则与词汇表）
2. 缺失的步骤在 `src/steps/` 补充，参数中直接声明所需页面对象：

```ts
When('我保存个人资料', async ({ profilePage }) => {
  await profilePage.save();
});
```

### 组件对象层（设计系统项目必读）

当 `data-testid` 打在组件**宿主**上、真实控件（input/textarea）在内部时，"宿主 → 内部元素"的映射属于组件库知识，必须收口到 `src/pom/components/`，禁止散落在页面对象里：

```ts
// 页面对象中声明式使用，组件库内部结构变化时只改组件类一处
export class ProfilePage extends BasePage {
  readonly path = '/profile.html';

  private readonly nickname = new TextInput(this.page.getByTestId('nickname'));
  private readonly bio = new TextArea(this.page.getByTestId('bio'));
  private readonly city = new Combobox(this.page.getByTestId('city'));

  async updateBio(text: string): Promise<void> {
    await this.bio.fill(text);
  }
}
```

已提供的组件：`TextInput`、`TextArea`（fill/clear/expectValue/expectEnabled/expectDisabled）、`Combobox`（select/expectSelected：点击触发器开面板 → 点选值，适配无 ARIA 的自定义下拉）。

约定：

- 组件构造参数接收 `Locator`（宿主）而非 testid 字符串，天然支持嵌套：`new TextInput(row.getByTestId('qty'))`
- 状态断言默认走原生 `disabled`/`aria-disabled`；若你们的组件禁用时只改宿主类名，在对应组件类中覆写 `expectDisabled`
- Web Component（open shadow DOM）无需特殊处理，`host.locator('input')` 自动穿透
- 分层依赖方向：Page → Component → Playwright 原语；组件不感知页面，更不感知 Gherkin

（注：示例站 saucedemo 的 `data-test` 直接打在原生元素上，无宿主包裹，因此示例页面对象未使用组件层。）

### API 造数（test data seeding）

定位：用接口把系统推到测试前置状态，**不做 API 功能测试**。基于 Playwright 内置的
`APIRequestContext`（无需 axios）。位置：`src/api/`，每个业务域一个客户端文件。

标准用法——Given 步骤造数 + 立刻登记清理，After hook 自动收尾：

```ts
Given('a registered user {string} exists', async ({ userApi, ctx }, alias: string) => {
  const user = await userApi.createUser(getUserTemplate(alias));   // 造数
  ctx.addCleanup(() => userApi.deleteUser(user.id));               // 谁造谁登记
});
// 场景结束（无论成败）After hook 按逆序执行清理，单条失败不阻断其余
```

约定：

- 所有请求统一断言 2xx（`ApiClient` 基类内置）——造数失败立刻炸，不让 UI 步骤跑在残缺数据上
- API 地址走 `env/.env.*` 的 `API_BASE_URL`（未配置回退 `BASE_URL`）
- 鉴权：在 `fixtures/base.fixtures.ts` 的 `apiContext` 处加 `extraHTTPHeaders`，token 用 worker 作用域 fixture 获取（每 worker 登录一次）
- 层级关系：steps/flows/hooks 可调 api 层；api 层不感知页面
- `user.api.ts` 是模板，按真实后端契约调整路径与类型

### 角色化登录

登录以**角色**为参数，凭证收口在 `src/config/users.ts`（角色 → 用户名/密码映射，
env 里只放 URL 类配置；真实项目中密码经 CI secrets 注入）。
应用暂不支持会话注入/缓存，**每次登录都真实走 UI**。两类步骤按用途选：

- `Given the "maker" is logged in`：业务场景的登录前置（`auth.steps.ts`）。
  走 `LoginFlow`：登录页 → 提交凭证 → **等落地页就绪**（portal URL + blotter
  渲染断言），后续步骤开始时页面已可操作；中途切换角色（maker→checker）
  先清 cookie 再登录
- `When the user logs in as "maker"` / `Then the trade portal is visible`：
  细粒度步骤，用于登录功能本身的测试（`login.feature`）
- 需要未登录状态的场景什么都不声明即可——登录态不隐式预注入

将来应用支持会话注入/缓存时，在 `LoginFlow` 或 auth 步骤处收口改造，
feature 文本与业务步骤都不需要动。
场景之间的隔离不受影响：每个场景仍是全新 browser context。

### Retry 与 flaky 治理

重试配置的三个层级：

```ts
retries: process.env.CI ? 1 : 0          // playwright.config.ts 全局默认（已配）
```
```gherkin
@retries:2                                # playwright-bdd 特殊标签，场景/feature 级
Scenario: 依赖第三方回调的场景
```
```bash
npx playwright test --retries=3           # 命令行临时覆盖
```

flaky 治理流程（retry 是止血不是治病）：

1. **显形**：重试后才过的用例在报告中标为 `flaky`（黄色），定期审计
2. **复现**：`npx playwright test --repeat-each=10 -g "场景名"` 把偶发变必发，配合 trace 定位
3. **修根因**：四大来源——即时快照断言（用 `expect().toBeVisible()` 替代 `isVisible()`）、
   固定 sleep、并行数据互踩、动画未稳定
4. **隔离**：短期修不好的打 `@flaky`，CI 主流程 `bddgen --tags "not @flaky"` 排除，
   隔离区单独跑不阻塞合并，修复后放回

### 多角色场景（maker/checker 四眼审批）

maker 创建 → checker 审批是**先后**发生的，因此不需要两个同时存活的浏览器会话：
同一会话内切换角色即可（清 cookie → 以新角色重新登录），
页面对象只需一套，凭证由 `src/config/users.ts` 按角色解析。
完整示例见 `features/trade-approval.feature` + `src/steps/trade-approval.steps.ts`：

```gherkin
Given a "FX_TRF" trade has been created via api        # 前置：走 API 造数，不占浏览器
When the checker approves the trade from the blotter   # 被测行为：从这里才开始用 UI
Then the trade is approved and marked as new
```

```ts
Given('a {string} trade has been created via api', (fixtures, productType: string) =>
  seedTradeWithPreset(fixtures, productType, 'standard'),  // preset：与 caseId 无关的业务别名模板
);

// 裁决（approves|rejects）与入口（blotter|trade details page）都是封闭选择集
When(
  /^the checker (approves|rejects) the trade from the (blotter|trade details page)$/,
  async ({ context, loginFlow, tradeFlow, ctx }, verdict: string, entry: string) => {
    await context.clearCookies();              // 清掉 maker 会话（前置走 API，从未登录过）
    await loginFlow.loginAs('checker');        // 以 checker 重新 UI 登录，落地即就绪
    const tradeId = ctx.require('tradeId');    // ctx 跨角色天然共享
    /* ...按 verdict × entry 分派到 tradeFlow 的四个方法，见 trade-approval.steps.ts */
  },
);
```

要点：

- 角色间传递业务产物（tradeId）走 `ctx`——它是场景级 fixture，与角色无关，
  只需保证场景之间不串（fixture 机制已保证）
- 切换角色 = 清 cookie + 重新登录；应用支持会话注入后只需改造 `LoginFlow`
- 若某天确实需要两个角色**同时在线**交替操作（极少见），再在步骤里临时
  `browser.newContext()` 开第二个会话，用完关闭

### Hooks（Before/After）

位置：`src/steps/hooks.ts`。执行顺序：

```
fixture setup → Before hooks → Background → 场景步骤 → After hooks → fixture teardown
```

**先问：真的需要 hook 吗？** 浏览器生命周期、失败截图/trace、每场景状态隔离都已由
Playwright/config/fixture 承担。hook 只保留两类职责：

- **标签驱动的条件准备**：`Before({ tags: '@mobile' }, ...)` 只对打标场景生效
- **横切收尾**：`After` 里清理场景产生的后端数据、失败时附加 `ctx` 到报告（已内置）

注意：`BeforeAll/AfterAll` 是**每 worker 一次**（Playwright 是多进程模型），不是全局一次；
"全局仅一次"的准备用 Playwright 的 `globalSetup` 配置。

### 数据驱动的三个层次

选型标准：**业务方评审场景时需要看到这个数据吗？**

| 层次 | 方式 | 适用 | 示例 |
|---|---|---|---|
| 1 | `Scenario Outline` + `Examples` | 数据量小且差异即业务规则 | `login.feature` 的无效凭证表 |
| 2 | 步骤 DataTable | 单场景的结构化输入 | 行内键值参数表 |
| 3 | `test-data/*` + 业务别名 | 数据量大或细节与业务无关 | `creates a trade using case "TC001"` |

层次 3 的约定：**caseId 放在场景标题里，不进步骤文本**——支持两种格式：
`[<caseId>] <业务描述>`（ADO 风格，与 playwright-azure-reporter 的匹配格式一致，
便于将来回写 Test Plans）或 `<caseId> - <业务描述>`。caseId 的形态由编号源头决定：
有 TMS（ADO）时照抄 work item ID；自管编号用 `<MODULE>-<流水号>`（TRADE-001），
**模块前缀即命名空间**——每个模块只在自己的 YAML 里编号，跨模块结构上不会撞号，
建全局索引时统一校验命名模式、检测跨文件重复（报错并指明两个来源文件），
文件内重复由 YAML 解析器直接拒绝。
数据文件用 **YAML**（支持注释记录 case 缘由/ticket、锚点复用公共字段、QA 手写友好）；
机器生成/消费的数据才用 JSON。建仓的完整示例（`features/create-trade.feature`）：

```gherkin
Scenario: TRADE-004 - Create an FX FBS trade with a full step-in
  When the maker creates a "FX_FBS" trade from the case data
  And the trade row matches the case data          # 验证点同样消费用例数据
```

机制与约定：

- **fixture 解析标题 + 通用取数**：`tradeCase` fixture 用 `caseIdFromTitle(testInfo.title)`
  截取 caseId（正则约定 `<caseId> - `，格式不符时报可诊断错误），再经**全局 case
  索引**取数——`getCase(caseId)` 首次调用时懒加载 `test-data/` 下全部 YAML 的
  cases 建索引（每 worker 一次），取数只凭 caseId，**不需要指明数据种类或所在
  文件**；`CreateTradeCase` 类型在 fixture 处一次性泛型收口。创建步骤和验证步骤
  都可解构它——验证点需要的期望值与输入同源
- **分模块 + 分数据种类 + 分片**：模块一个目录（`test-data/trades/`、`test-data/products/…`），
  目录内**每种前置/动作一个数据文件**——形状不同的数据不共用命名空间
  （`create-trade-cases.yaml`、`cancellation-details.yaml`…），文件内 preset 与
  cases 放在一起（同一种数据的两个视角）。单文件起步；用例攒多后把文件原地升级为
  同名目录、**按功能面**拆成任意多个同构分片（`core.yaml`、`stepin.yaml`…，每片
  仍是 preset+cases 同文件）。全局索引扫描整棵 `test-data/` 目录树并检测跨文件
  重复键（报错指明两个来源文件）——取数与文件组织**彻底解耦**，移动/拆分/新增
  文件，steps/fixtures 零改动。锚点继承不跨文件——继承链写在同一分片内。
  **YAML 顶层键即命名空间**：`cases` 是全局唯一的一个（caseId 靠模块前缀
  TRADE-001 / PRODUCT-001 天然不撞号）；preset 每种数据自带一个（`trade_preset`、
  `cancel_preset`…，别名只需命名空间内唯一——两边都可以叫 `standard`）。取数是
  两个通用函数：`getCase(caseId)` / `getPreset(命名空间, 别名)`，命名空间是关键字
  参数而非函数——**新增数据种类零新函数**；类型在调用点泛型收口（fixture 的
  `getCase<CreateTradeCase>`、步骤的 `getPreset<CreateTradeCase>('trade_preset', …)`），
  数据形状的类型定义住在各模块的 `<module>-cases.ts`（如 `trade-cases.ts`），
  通用加载在 `src/utils/case-data.ts`
- **并行安全**：YAML 是只读输入，`getCase` 返回**深拷贝**——步骤改了数据只影响
  本场景副本，不会经 worker 内共享缓存污染后续场景；运行时产物（tradeId）走
  场景级 `ctx`；需要"每次运行唯一"的输入时在步骤里用 `testInfo.workerIndex`/时间戳派生
- **fail-fast**：caseId 不存在列出全部可用值；`.dat` 缺失立刻报错，不让上传静默失败
- **productType 不进 YAML**：它是固定枚举、直接绑定 `.dat` 路径
  （`test-data/trades/dat/{FX_TRF|FX_CO|FX_FBS}.dat`，代码级映射见 `trade-cases.ts`），
  由场景步骤声明（`creates a "FX_TRF" trade ...`）；YAML 只放会变的业务参数
  （counterparty/portfolio/stepIn），step-in 是可选字段而非独立流程
- **preset 与 cases 分开**：建仓只是**前置条件**（被测的是审批/取消等后续行为）时，
  数据不绑 caseId——用 `trade_preset` 里的业务别名模板，Given 走 API 造数（不占浏览器）：
  `Given a "FX_TRF" trade has been created via api`（standard 模板）、
  `... with a full step-in via api`、`... with a partial step-in via api`。
  presets 是小而稳定的枚举集合，不像 cases 会随覆盖率增长，所以一个 Given 对应一种
  自然语言短语，不把 preset 的 YAML key 当参数塞进引号暴露给 Gherkin 文本
- 新增用例 = YAML 加一段 + 标题带 caseId 的新场景，代码零改动

**场景怎么组织（报告可读性优先）**：

- **一个 case 一个场景**，标题各自描述业务行为（`TRADE-004 - Create an FX FBS trade with a full step-in`）——
  报告里读到的是不同的行为，而不是"同一个描述跑了 N 遍"；caseId 不进 Examples
- **Scenario Outline 只用在差异点本身业务可见**的场合：差异（如 productType）
  写进标题模板，每行生成的测试名天然不同：

```gherkin
Scenario Outline: <caseId> - Create a plain <productType> trade
  When the maker creates a "<productType>" trade from the case data
  Examples:
    | caseId    | productType |
    | TRADE-001 | FX_TRF      |
    | TRADE-002 | FX_CO       |
    | TRADE-003 | FX_FBS      |
```

Outline 里每一行仍然带独立 caseId，标题因此逐行不同，报告不会把三行读成"同一描述
重复三次"。caseId 是驱动这张表的唯一必要列——每行对应 case 的 counterparty/portfolio
该相同就相同、该不同就不同，`tradeCase` fixture 按 caseId 查出完整数据，不要求同一张
表里的其它字段也保持一致。真正业务上独立的分支（如 step-in 的 full/partial）不适合
塞进这张表，是因为它们验证的不是 productType 维度，而是各自单独成场景
（`TRADE-004`/`TRADE-005`）。

创建步骤都把实际使用的用例写入
`ctx`（`ctx.set('tradeCase', ...)`），验证步骤统一从 `ctx` 读——断言与数据来源解耦。

### 跨步骤共享状态与数据隔离

同一机制解决两件事：`src/fixtures/base.fixtures.ts` 中的 `ScenarioContext`（test 作用域 fixture）。

- **共享**：步骤 A 写入 `ctx.xxx`，步骤 B 读取——每个场景内是同一个实例
- **隔离**：场景结束实例销毁，场景之间、并行 worker 之间互不可见

```ts
When('the maker creates a new trade:', async ({ tradeFlow, ctx }, table: DataTable) => {
  ctx.set('tradeId', await tradeFlow.createTrade(request));  // 写入本场景上下文
});

Then('the new trade is pending approval', async ({ tradeFlow, ctx }) => {
  const tradeId = ctx.require('tradeId');  // 断言式读取：未写入时给出可诊断错误
  await (await tradeFlow.findTradeRow(tradeId)).expectContains(tradeId);
});
```

键声明在各领域 fixtures 文件中通过 declaration merging 注入基座的
`ScenarioData` interface（见 `trade.fixtures.ts` 的 `declare module`），
`set/get/require` 是泛型方法——**新增一份跨步骤数据 = 在本域文件加一行键声明**，
读写自动获得类型推导；ctx 对象运行时仍是同一个，跨域数据流不受拆分影响；
`require()` 在数据未产生时立即抛出可诊断错误，而非让 `undefined` 渗透到后续断言。

**红线：禁止用 steps 文件的模块级变量共享状态**——同一 worker 会串场景，并行模式下必然 flaky。

隔离的完整层次：

| 层次 | 机制 | 由谁保证 |
|---|---|---|
| 浏览器状态（cookie/storage） | 每个场景新建 browser context | Playwright 自动 |
| 场景内运行时数据 | `ScenarioContext` fixture | 本框架 |
| 后端数据（并行互踩） | 每 worker 独立账号 / 每场景唯一数据 | 接入真实业务时按需实现 |

后端隔离示例（需要时启用）——worker 作用域 fixture 按 `parallelIndex` 分配账号：

```ts
account: [
  async ({}, use, workerInfo) => {
    await use(testAccounts[workerInfo.parallelIndex % testAccounts.length]);
  },
  { scope: 'worker' },
],
```

### 新增一个环境

复制 `env/.env.example` 为 `env/.env.<名称>`，填入配置，然后 `ENV=<名称> npm test`。
真实项目中请将 `env/.env.*` 加入 `.gitignore`（模板已留注释），密钥通过 CI secrets 注入。

## IDE 支持（VS Code）

打开项目时按提示安装推荐扩展（`.vscode/extensions.json` 已配置），其中
**Cucumber 官方扩展** 提供 feature ↔ 步骤定义的导航：

| 操作 | 快捷键 |
|---|---|
| 从 feature 步骤跳到步骤定义 | 步骤上 `F12` 或 `⌘/Ctrl + Click` |
| 写步骤时自动补全已有步骤 | 直接输入触发（复用优先的关键） |
| 未定义步骤检测 | 编辑器内直接标黄 |

路径映射在 `.vscode/settings.json` 的 `cucumber.features` / `cucumber.glue`，
新增步骤目录时需同步更新。Playwright 官方扩展可对 `.features-gen` 生成的
测试提供运行/调试按钮（先执行 `npx bddgen`）。

说明：Cucumber 扩展是纯静态语言服务器（解析 Gherkin + 扫描 `Given/When/Then`
的 cucumber expression），不运行测试，因此与 playwright-bdd 完全兼容——
这是 playwright-bdd 官方文档推荐的 IDE 集成方式。注意 **官方 Cucumber 扩展**
与 **Cucumber (Gherkin) Full Support**（alexkrechik）二选一，同时启用会冲突。

## 定位器规范

- 首选 `data-test` 属性（已配置为 Playwright 的 `testIdAttribute`）
- 其次 `getByRole` 等语义化定位器
- 禁止 XPath 与依赖 DOM 层级的 CSS 链

## 失败排查

- 失败自动截图 + 保留 trace，产物在 `test-results/`
- 本地回放 trace：`npx playwright show-trace test-results/<用例目录>/trace.zip`
- CI 失败后到 Actions 的 artifacts 下载 `e2e-reports`
