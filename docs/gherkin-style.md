# Gherkin 业务语言规范

步骤文本既是 API（bddgen 的匹配键）又是文档（BA 读的报告文本）。这份规范约束
"怎么措辞"，让词汇表保持收敛——规则少而硬，评审场景时对着查。

## 六条规则

### 1. 人称：第三人称 + 具名角色，禁用 "I"

主语从封闭的角色表取（见词汇表）；匿名操作者用 `the user`。
maker/checker 出现在同一场景时，"I" 无法表达是谁在操作——单角色场景用 "I"
埋的是多角色场景的雷。

```gherkin
Given the "maker" is logged in          # ✓
When the checker approves the trade     # ✓
Given I am logged in as "maker"         # ✗ 第一人称
```

### 2. 句式：每个关键字一个固定模板

| 关键字 | 模板 | 例 |
|---|---|---|
| Given（前置状态） | 系动词 / 完成时，描述状态不描述动作 | `a "FX_TRF" trade has been created via api` |
| When（被测动作） | 主动语态一般现在时，必须有角色主语 | `the maker creates a "FX_TRF" trade from the case data` |
| Then（可观察结果） | 陈述句，**不用 should** | `the trade is pending approval` |

### 3. 业务状态是封闭短语，不是参数

一种业务状态一个短语，具体列值（status / event status）只存在于步骤实现里，
不出现在 Gherkin。状态词汇是**二维**的——事件裁决 × 交易状态（见词汇表）。
短语用正则受限选择集实现，表外写法直接 undefined step，不会静默漂移。

```gherkin
Then the trade is approved and marked as cancelled            # ✓
Then the trade should show event status "Approved"            # ✗ 列值当参数
```

### 4. 引号参数只留两类

- 业务可见的固定枚举：productType（`"FX_TRF"`）、角色名（`"maker"`）
- Examples 表中"差异本身即业务规则"的值（如无效凭证与错误消息）

其余数据一律走 caseId（场景标题绑定）或 preset 短语。判定法：**参数的实际
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
| `the trade is approved and marked as cancelled` | Cancelled + Approved | 取消获批（尚无场景覆盖） |
| `the trade is approved and marked as amended` | Amended + Approved | 修改获批（尚无场景覆盖） |
| `the trade is rejected and marked as new` | New + Rejected | 建仓被拒（TRADE-102，已验证） |
| `the trade is rejected and marked as cancelled` | Cancelled + Rejected | 取消被拒（尚无场景覆盖，**列值未验证——见下方警告**） |
| `the trade is rejected and marked as amended` | Amended + Rejected | 修改被拒（尚无场景覆盖，**列值未验证——见下方警告**） |

approve/reject 批的都是 **pending 事件**，交易状态取决于事件类型——所以结果
短语必须同时锁定两个维度（裁决 × 交易状态），单说 "approved"/"rejected" 会
丢失"批完/拒完之后交易是什么"。

**注意**：reject 侧的 cancelled/amended 两行是**结构上的推广**，不是已验证的
事实——目前只有 `new`（建仓被拒）有真实测试覆盖。取消/修改被拒后交易状态更
可能是"维持被裁决前的状态"而非"套用 approve 侧的同名值"（例如取消被拒后
交易该维持获批前的状态，而不是变成 Cancelled——Cancelled 应该是取消**成功**
才有的结果）。新增取消/修改的拒绝场景前，先跟真实应用确认列值，不要照抄这
张表的结构直接假定。

### 机制限定语

| 限定语 | 含义 |
|---|---|
| `via api` | 前置造数走 API（不占浏览器、不依赖登录态），仅用于 Given |
| `from the case data` | 可变参数经标题 caseId 从 YAML 取，仅用于 When |

## 新增步骤检查清单

1. 先搜已有步骤（复用优先，IDE 里输入即补全）
2. 主语在角色表里吗？
3. 句式符合关键字模板吗？
4. 引号参数属于允许的两类吗？
5. 新状态短语？——在 trade-approval.steps.ts 的状态断言处登记，并更新本词汇表
