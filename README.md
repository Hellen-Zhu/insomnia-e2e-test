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
│   ├── flows/          # 流程层：跨页面业务流程编排（登录、下单）
│   ├── pages/          # 页面层：POM，封装定位器与页面行为
│   ├── components/     # 组件层：设计系统组件对象（宿主→内部元素的映射）
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
| `src/flows/` | 跨页面业务流程编排 + 到达断言 | page | 持有定位器、感知 Gherkin |
| `src/pages/` | 定位器 + 单页行为 + 页面级断言 | component、原语 | 其他 page、感知 Gherkin |
| `src/components/` | 设计系统组件（宿主→内部） | 原语 | page、flow |

**step 调 flow 还是 page？** 这行 Gherkin 跨页面（`the maker creates a new trade`）→ flow；单页动作（`the maker is on the trade portal`）→ page。

## 如何扩展

### 新增一个页面对象

1. 在 `src/pages/` 创建类，继承 `BasePage`：

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
或其祖先**——领域之间不要互相 extend，只从基座 extend；跨域场景需要
时另建一个合并两域的 test 实例。

### 新增一个场景

1. 在 `features/` 写 Gherkin 场景（优先复用已有步骤）
2. 缺失的步骤在 `src/steps/` 补充，参数中直接声明所需页面对象：

```ts
When('我保存个人资料', async ({ profilePage }) => {
  await profilePage.save();
});
```

### 组件对象层（设计系统项目必读）

当 `data-testid` 打在组件**宿主**上、真实控件（input/textarea）在内部时，"宿主 → 内部元素"的映射属于组件库知识，必须收口到 `src/components/`，禁止散落在页面对象里：

```ts
// 页面对象中声明式使用，组件库内部结构变化时只改组件类一处
export class ProfilePage extends BasePage {
  readonly path = '/profile.html';

  private readonly nickname = new TextInput(this.page.getByTestId('nickname'));
  private readonly bio = new TextArea(this.page.getByTestId('bio'));
  private readonly city = new Dropdown(this.page.getByTestId('city'));

  async updateBio(text: string): Promise<void> {
    await this.bio.fill(text);
  }
}
```

已提供的组件：`TextInput`、`TextArea`（fill/clear/expectValue/expectEnabled/expectDisabled）、`Dropdown`（select/expectSelected，展示带浮层交互的封装方式）。

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

### 登录 API 化与 worker 级会话复用

套件默认**不走 UI 登录**：`workerStorageState`（worker 作用域 fixture）每个 worker
只构建一次会话，覆写的 `storageState` 让每个场景的浏览器上下文创建时即已登录。

```
worker 启动 → 构建会话一次（真实项目：调登录 API 换 token）
  ├── 场景 1 的 context 带会话创建   ← 直接访问业务页
  ├── 场景 2 的 context 带会话创建
  └── ...
```

- **`@guest` 标签** = 不注入会话：登录功能本身的测试（`login.feature`）从未登录状态开始
- `Given I am logged in`：只做"直达业务页 + 到位断言"，不再走登录表单
- `Given I am logged in as {string}`：保留的 UI 登录通道，用于以特定身份登录的场景
- 接入真实项目：在 `workerStorageState` 中调登录 API 换 token 组装 cookies/localStorage；
  多账号并行隔离按 `workerInfo.parallelIndex` 分配账号
- 场景之间的隔离不受影响：共享的只是"会话凭证"，每个场景仍是全新 browser context

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
同一会话内用 `loginAs(username)` fixture 切换身份即可（清 cookie → 注入目标账号会话），
页面对象只需一套，账号来自 `MAKER_USERNAME`/`CHECKER_USERNAME`。
完整示例见 `features/trade-approval.feature` + `src/steps/trade-approval.steps.ts`：

```ts
Given('the maker is on the trade portal', async ({ loginAs, tradePortalPage }) => {
  await loginAs(env.makerUsername);
  await tradePortalPage.open();
});

When('the maker creates a new trade:', async ({ tradeFlow, ctx }, table: DataTable) => {
  ctx.set('tradeId', await tradeFlow.createTrade(table.rowsHash() as NewTradeRequest));
});

When('the checker approves the trade', async ({ loginAs, tradePortalPage, tradeFlow, ctx }) => {
  await loginAs(env.checkerUsername);          // 切换身份，浏览器会话不变
  await tradePortalPage.open();
  await tradeFlow.approveTrade(ctx.require('tradeId'));  // ctx 跨角色天然共享
});
```

要点：

- 角色间传递业务产物（tradeId）走 `ctx`——它是场景级 fixture，与角色无关，
  只需保证场景之间不串（fixture 机制已保证）
- `loginAs` 的实现在真实项目中替换为调登录 API 换取目标账号 token 后注入
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
| 2 | 步骤 DataTable | 单场景的结构化输入 | `trade-approval.feature` 的新建交易表单 |
| 3 | `test-data/*` + 业务别名/路径 | 数据量大或细节与业务无关 | `test-data/trades/trf-sample.json` 交易捕获文件 |

层次 3 的约定：Gherkin 里只出现**业务别名或文件路径**，真实数据在 `test-data/` 下维护；
需要别名映射时提供类型化访问函数（别名不存在时报错并列出可用值）。

### 跨步骤共享状态与数据隔离

同一机制解决两件事：`src/fixtures/base.fixtures.ts` 中的 `ScenarioContext`（test 作用域 fixture）。

- **共享**：步骤 A 写入 `ctx.xxx`，步骤 B 读取——每个场景内是同一个实例
- **隔离**：场景结束实例销毁，场景之间、并行 worker 之间互不可见

```ts
When('the maker creates a new trade:', async ({ tradeFlow, ctx }, table: DataTable) => {
  ctx.set('tradeId', await tradeFlow.createTrade(request));  // 写入本场景上下文
});

Then('the new trade should appear ...', async ({ tradeFlow, ctx }) => {
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
