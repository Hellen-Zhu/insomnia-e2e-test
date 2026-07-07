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
│   ├── pages/          # 页面层：POM，封装定位器与页面行为
│   ├── components/     # 组件层：设计系统组件对象（宿主→内部元素的映射）
│   ├── steps/          # 步骤层：Gherkin ↔ POM 的薄胶水
│   │   └── fixtures.ts # POM 依赖注入中心
│   ├── config/         # 配置层：环境相关配置（随 ENV 变化）
│   └── utils/          # 纯函数工具（数据加载、格式化等，与页面无关）
├── test-data/          # 外部测试数据（JSON），Gherkin 中以业务别名引用
├── env/                # 各环境变量文件 (.env.dev / .env.staging ...)
├── playwright.config.ts
└── .github/workflows/  # CI
```

**分层纪律（可维护性的关键）：**

| 层 | 职责 | 禁止 |
|---|---|---|
| `features/` | 纯业务语言描述场景 | 选择器、URL 等技术细节 |
| `src/steps/` | 一行 Gherkin ↔ 一次 POM 方法调用 | 定位器、业务逻辑 |
| `src/pages/` | 定位器 + 页面行为 + 页面级断言 | 感知 Gherkin / 测试流程 |

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

2. 在 `src/steps/fixtures.ts` 注册一行：

```ts
profilePage: async ({ page }, use) => use(new ProfilePage(page)),
```

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

### 数据驱动的三个层次

选型标准：**业务方评审场景时需要看到这个数据吗？**

| 层次 | 方式 | 适用 | 示例 |
|---|---|---|---|
| 1 | `Scenario Outline` + `Examples` | 数据量小且差异即业务规则 | `login.feature` 的无效凭证表 |
| 2 | 步骤 DataTable | 单场景的结构化输入 | `checkout.feature` 的批量加购 |
| 3 | `test-data/*.json` + 业务别名 | 数据量大或细节与业务无关 | `"default" shipping profile` |

层次 3 的约定：Gherkin 里只出现**业务别名**，真实值在 `test-data/` 下的 JSON 中，
通过 `src/utils/test-data.ts` 的类型化访问函数读取（别名不存在时报错并列出可用值）。

### 新增一个环境

复制 `env/.env.example` 为 `env/.env.<名称>`，填入配置，然后 `ENV=<名称> npm test`。
真实项目中请将 `env/.env.*` 加入 `.gitignore`（模板已留注释），密钥通过 CI secrets 注入。

## 定位器规范

- 首选 `data-test` 属性（已配置为 Playwright 的 `testIdAttribute`）
- 其次 `getByRole` 等语义化定位器
- 禁止 XPath 与依赖 DOM 层级的 CSS 链

## 失败排查

- 失败自动截图 + 保留 trace，产物在 `test-results/`
- 本地回放 trace：`npx playwright show-trace test-results/<用例目录>/trace.zip`
- CI 失败后到 Actions 的 artifacts 下载 `e2e-reports`
