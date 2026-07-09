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

  Scenario: TRADE-001 - Create a plain FX TRF trade
    When the maker creates a "FX_TRF" trade from the case data
    Then the new trade should appear with status "New" and event status "pending approval"
    And the trade row should match the case data

  Scenario: TRADE-002 - Create a plain FX CO trade
    When the maker creates a "FX_CO" trade from the case data
    Then the new trade should appear with status "New" and event status "pending approval"
    And the trade row should match the case data

  Scenario: [TRADE-003] Create an FX FBS trade with partial step-in
    When the maker creates a "FX_FBS" trade from the case data
    Then the new trade should appear with status "New" and event status "pending approval"
    And the trade row should match the case data

  Scenario Outline: Create a plain <productType> trade using defaults
    When the maker creates a "<productType>" trade using default case data
    Then the new trade should appear with status "New" and event status "pending approval"
    And the trade row should match the case data

    Examples:
      | productType |
      | FX_FBS      |
