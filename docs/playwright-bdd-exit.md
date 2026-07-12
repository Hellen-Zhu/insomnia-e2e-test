# playwright-bdd 耦合面与退出路径

选型汇报（`docs/framework-selection.html`）中"playwright-bdd 可整体替换"的论断，本文给出精确定义：
**哪些代码只属于 playwright-bdd、退出时各层分别发生什么、唯一会丢失的能力是什么。**

## "整体替换"的精确含义

playwright-bdd 只做一件事：`bddgen` 在**构建期**读 `.feature` 文本，用 cucumber expression /
正则匹配已注册的步骤函数，编译出标准 Playwright spec——**运行时它不存在**，跑起来的就是纯
Playwright Test。

因此"整体替换"换掉的是**"业务文本 → 代码"的匹配机制**，不是任何业务逻辑：
业务文本降级为 `test.step` 的标题字符串，步骤函数体的逻辑原样搬家。

## 只属于 playwright-bdd 的代码（逐项清点）

全仓 import 面（`grep -rn "playwright-bdd"` 实测）：

| # | 位置 | 属于 playwright-bdd 的部分 | 退出动作 |
|---|---|---|---|
| 1 | `src/fixtures/base.fixtures.ts` | 第 1 行 `import { test as base } from 'playwright-bdd'`（fixture 树的根） | 改为从 `@playwright/test` import，一行 |
| 2 | `src/fixtures/{trade-portal,trade,product}.fixtures.ts` | 各文件 1 行 `createBdd` import + 末尾 `export const { Given, When, Then } = createBdd(test)` | 删除，每文件 2~3 行；**`test.extend` 的全部 fixture 定义体原样保留**（179 行中约 10 行真正动） |
| 3 | `src/fixtures/hooks.ts`（36 行） | `createBdd` 提供的 Before/After 注册 | 换 Playwright 原生 auto-fixture 实现同样逻辑 |
| 4 | `src/test/features/`（118 行） | Gherkin 文本。格式是 Cucumber 标准，但本工具链中唯一消费者是 bddgen | 重生为 spec 的 `test()` 标题 + `test.step` 标题（plain 分支 `tests/*.spec.ts` 即其形态） |
| 5 | `src/test/steps/`（214 行） | 仅注册壳：`Given('...', ...)` 的匹配串、正则受限选择集、"首参数必须字面量解构"的静态解析约束 | 函数体逻辑（造数编排、`STATUS_BY_PHRASE` 映射、对 flow 的调用）**原样搬入 spec/helper**，只换壳 |
| 6 | `playwright.config.ts` | `defineBddConfig({...})` 块与 `cucumberReporter` | 换回普通 `testDir`，几行 |
| 7 | `package.json` | 4 个 script 中的 `bddgen &&` 前缀 | 删前缀 |
| 8 | 生成物 `.features-gen/`（git 忽略） | bddgen 编译输出 | 非手写代码，退出即消失 |

目录结构已让耦合面物理可见：feature 与 steps 同住 `src/test/` 一棵子树——
**退出 = 删除 `src/test/` + `src/fixtures/` 里的 createBdd 行与 hooks.ts + config 两行。**

## 住在耦合层、但**不属于** playwright-bdd 的（退出时存活）

- 步骤函数体的全部业务编排：API 造数逻辑、状态短语 → 列值映射表、flow 调用序列
- fixture 定义体：`ScenarioContext`、页面/流程/API 客户端的注册与继承树
- 业务词汇规范（`docs/gherkin-style.md` 六规则）——它约束**措辞**，不绑定载体，
  plain 分支以 `test.step` 标题的形式沿用同一张词汇表
- POM / API / 数据 / 配置层（约 1 946 行，占比 79%）**对 BDD 层零感知，零改动**

## 退出时唯一丢失的东西

不是代码，是两项能力：

1. **静态强制**：bddgen 对"表外措辞直接报 undefined step"的编译期拦截。
   plain 侧的替代是把短语 → 值的映射收口进共享 helper + code review，属于纪律替代机制。
2. **BA 协作入口**：`.feature` 是非工程师可直接编辑的文件；`test.step` 标题在 spec 代码内部。
   报告可读性保留（step 标题仍是完整业务句子），可编辑性降级。

## 实证：双分支 diff 的解读

`feature/plain-playwright` 是不含 playwright-bdd 的镜像分支。对比两分支时注意剔除噪音：
UI 模型层（pages/flows）下的差异**与 BDD 无关**，是镜像分支的同步滞后（locator 收口、
trade-detail 审批用例、目录重构等尚未同步——plain 分支仍是旧目录结构）。
剔除后，结构性差异只有：

```
src/test/features/      ->  tests/*.spec.ts      （文本换形态）
src/test/steps/         ->  删除                  （逻辑搬入 spec/helper）
src/fixtures/*          ->  每文件头尾 2~3 行     （去掉 createBdd 包装 + hooks.ts）
playwright.config.ts    ->  defineBddConfig 块    （换回 testDir）
package.json            ->  bddgen 前缀           （删除）
pages + flows + api + data  ->  零改动
```

一句话总结：**118 行文本换形态、214 行逻辑搬家换壳、179 行 fixtures 改约 10 行、
config 和 scripts 各改几行——1 946 行框架无关资产零感知。**
这就是汇报中"迁移成本不是估算的，是做过一遍量出来的"的依据。
