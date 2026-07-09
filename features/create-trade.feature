@trade
Feature: Create trade (data-driven)

  Case parameters live per module in test-data/trades/create-trade-cases.yaml.
  A scenario binds to its case through the title convention
  "<caseId> - <business description>". Each case gets its own scenario with
  a distinct business summary, so reports read as different behaviours —
  not one case repeated. Scenario Outline is reserved for cases where the
  differentiator itself is business-visible (e.g. product type), so the
  generated titles stay distinct. Verification steps read the same case
  data as the creation steps.

  Background:
    Given I am logged in as "maker"
    And I am on the trade portal

  # productType 由 Examples 列驱动；每行的 counterparty/portfolio 各自来自
  # 该行 caseId 对应的 case 数据，可以相同也可以不同——Outline 只要求 caseId
  # 逐行不同，保证标题可追溯、报告不去重，不要求其余字段也保持一致
  Scenario Outline: <caseId> - Create a plain <productType> trade
    When the maker creates a "<productType>" trade from the case data
    Then the new trade should appear with status "New" and event status "pending approval"
    And the trade row should match the case data

    Examples:
      | caseId    | productType |
      | TRADE-001 | FX_TRF      |
      | TRADE-002 | FX_CO       |
      | TRADE-003 | FX_FBS      |

  # step-in 是独立于产品类型的流程分支，固定用 FX_FBS 各测一个模式，不进 Outline
  Scenario: TRADE-004 - Create an FX FBS trade with a full step-in
    When the maker creates a "FX_FBS" trade from the case data
    Then the new trade should appear with status "New" and event status "pending approval"
    And the trade row should match the case data

  Scenario: TRADE-005 - Create an FX FBS trade with a partial step-in
    When the maker creates a "FX_FBS" trade from the case data
    Then the new trade should appear with status "New" and event status "pending approval"
    And the trade row should match the case data
