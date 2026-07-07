# E2E 自动化测试框架

基于 **Playwright + TypeScript + Cucumber（playwright-bdd）** 的端到端自动化测试框架，页面层采用 **POM（Page Object Model）** 模式。示例基于公开演示站 [saucedemo.com](https://www.saucedemo.com)，开箱即可运行。

## 架构

```
features/*.feature (Gherkin, 业务可读, 支持中文关键字)
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
│   ├── steps/          # 步骤层：Gherkin ↔ POM 的薄胶水
│   │   └── fixtures.ts # POM 依赖注入中心
│   └── config/         # 配置层：环境加载
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
