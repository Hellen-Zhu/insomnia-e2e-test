# 业务语言规范（test.step 措辞）

`test.step` 的标题既是 HTML 报告/trace 里的可读文本（BA 读的），又是场景的
唯一文字表述（没有独立的 .feature 层）。这份规范约束"怎么措辞"，让词汇表保持
收敛——规则少而硬，写新步骤时对着查。

> 本文档与 `feature/playwright-bdd-framework` 分支的同名文档共享同一套词汇表——
> 两个分支验证的是同一批业务行为，读者（尤其业务方）不应该因为技术实现分支
> 不同而看到不一样的措辞。

## 六条规则

### 1. 人称：第三人称 + 具名角色，禁用 "I"

主语从封闭的角色表取（见词汇表）；匿名操作者用 `the user`。
maker/checker 出现在同一测试里时，"I" 无法表达是谁在操作——单角色测试用 "I"
埋的是多角色测试的雷。

```ts
await test.step('Given the "maker" is logged in', ...)   // ✓
await test.step('When the checker approves the trade', ...) // ✓
await test.step('Given I am logged in as "maker"', ...)  // ✗ 第一人称
```

### 2. 句式：每个关键字前缀一个固定模板

`test.step` 标题延续 Given/When/Then 前缀，仅作为读者的语义锚点（不驱动任何匹配机制）：

| 前缀 | 模板 | 例 |
|---|---|---|
| Given（前置状态） | 系动词 / 完成时，描述状态不描述动作 | `a "FX_TRF" trade has been created via api` |
| When（被测动作） | 主动语态一般现在时，必须有角色主语 | `the maker creates a "FX_TRF" trade from the case data` |
| Then（可观察结果） | 陈述句，**不用 should** | `the trade is pending approval` |

### 3. 业务状态是封闭短语，不是参数

一种业务状态一个短语，具体列值（status / event status）只存在于 helper 函数
实现里，不拼进 `test.step` 标题。状态词汇是**二维**的——事件裁决 × 交易状态
（见词汇表）。这里没有 bddgen 那样的静态匹配器拒绝表外写法，**收敛靠 helper
函数收口短语 → 列值的映射**（如 `trade-approval.spec.ts` 的 `STATUS_BY_PHRASE`）：
新状态一律加进这张映射表，不在调用点现拼字符串再传列值。

```ts
await test.step(`Then the trade is approved and marked as ${status}`, ...)     // ✓ status 来自受限集合
await test.step(`Then the trade should show event status "${eventStatus}"`, ...) // ✗ 列值当参数直接拼
```

### 4. 引号/模板参数只留两类

- 业务可见的固定枚举：productType（`"FX_TRF"`）、角色名（`"maker"`）
- 数据表 + `for` 循环生成测试时，"差异本身即业务规则"的值（如无效凭证与错误消息）

其余数据一律走 caseId（测试标题绑定）或 preset 短语。判定法：**参数的实际
取值如果永远只有一两种，它应该是短语**（参照 preset Given 与状态短语的先例）。

### 5. 一词一概念（ubiquitous language）

词汇表之外不引入同义词；拼法唯一（`step-in`，不写 `stepin`）。
机制限定语统一：API 前置造数一律 `via api`，不出现变体。

### 6. 读者测试

每个新步骤问一句：**BA 不看实现能否复述这句在验证什么？**
`the trade is pending approval` 通过；`event status "Approved"` 不通过
（event status 是列名，不是业务概念）。

## 词汇表

### 角色（When 的主语）

| 角色 | 含义 |
|---|---|
| `the maker` | 交易创建方 |
| `the checker` | 审批方 |
| `the user` | 匿名操作者（登录功能本身的测试） |

### 领域名词

trade（不用 deal）· counterparty · portfolio · step-in（连字符）·
approve / reject（不用 authorise / decline）· case data（caseId 绑定的用例数据）

### 业务状态短语（Then）

| 短语 | 断言的列值 | 场景 |
|---|---|---|
| `the trade is pending approval` | New + pending approval + 行已在 blotter | 创建后（主语可加装饰变体 new / full step-in / partial step-in） |
| `the trade is approved and marked as new` | New + Approved | 建仓获批 |
| `the trade is approved and marked as cancelled` | Cancelled + Approved | 取消获批 |
| `the trade is approved and marked as amended` | Amended + Approved | 修改获批 |
| `the trade is rejected` | Rejected（暂一维） | 拒绝后交易状态列的行为待真机确认，再升级为二维 |

approve 批的是 **pending 事件**，交易状态取决于事件类型——所以结果短语必须
同时锁定两个维度，单说 "approved" 会丢失"批完之后交易是什么"。

### 机制限定语

| 限定语 | 含义 |
|---|---|
| `via api` | 前置造数走 API（不占浏览器、不依赖登录态），仅用于 Given |
| `from the case data` | 可变参数经标题 caseId 从 YAML 取，仅用于 When |

## 新增步骤检查清单

1. 先搜已有 `test.step` 标题（复用优先）
2. 主语在角色表里吗？
3. 句式符合前缀模板吗？
4. 模板字符串里的参数属于允许的两类吗？
5. 新状态短语？——在 `tests/trade-approval.spec.ts` 的映射表处登记，并更新本词汇表
