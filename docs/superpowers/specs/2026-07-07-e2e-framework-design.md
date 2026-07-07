# E2E 自动化框架设计文档

日期：2026-07-07
状态：已确认

## 目标

搭建一套高复用、可维护的 E2E 自动化测试框架，技术栈为 Playwright + TypeScript + Cucumber（Gherkin），页面层采用 POM（Page Object Model）模式。

## 关键决策

| 决策点 | 选择 | 理由 |
|---|---|---|
| Cucumber 集成方式 | playwright-bdd（编译型） | 保留 Playwright Test Runner 全部能力（原生并行、重试、trace viewer、UI 模式、官方报告）；社区主流方向，维护活跃 |
| POM 实例化方式 | Playwright fixtures 依赖注入 | 步骤定义按需声明页面对象，无手动 new，页面对象懒加载且相互解耦 |
| 示例被测应用 | saucedemo.com（公开演示站） | 开箱即可跑通，团队接入真实业务时替换即可 |
| 环境管理 | `ENV` 变量 + `env/.env.<name>` 文件 | dev/staging/prod 切换只需改一个变量 |

## 架构

执行链路：

```
features/*.feature (Gherkin, 业务可读)
        ↓ bddgen 编译
.features-gen/ (Playwright 原生测试, git 忽略)
        ↓
Playwright Test Runner (并行 / 重试 / trace)
        ↓
双报告: Playwright HTML + Cucumber HTML
```

## 分层职责约定

| 层 | 目录 | 职责 | 禁止 |
|---|---|---|---|
| 特性层 | `features/` | 纯业务语言描述场景 | 选择器、URL 等技术细节 |
| 步骤层 | `src/steps/` | 一行 Gherkin ↔ 一次 POM 方法调用（薄胶水） | 定位器、业务逻辑 |
| 页面层 | `src/pages/` | 封装定位器、页面行为、页面级断言 | 感知 Gherkin / 测试流程 |
| 配置层 | `src/config/` | 环境加载与校验 | — |

## 失败取证与报告

- 失败自动截图（`screenshot: only-on-failure`）
- 失败保留 trace（`trace: retain-on-failure`），可用 trace viewer 回放
- CI 上失败重试 1 次，报告与 trace 上传为 GitHub Actions artifacts
- 双报告：Playwright HTML（工程师用）+ Cucumber HTML（业务方用）

## 示例场景

- 登录：成功登录、错误凭证提示（Scenario Outline 数据驱动）
- 购物流程：加购 → 购物车校验 → 结算下单（多页面对象协作）
