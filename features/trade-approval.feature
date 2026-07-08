@trade
Feature: Trade maker-checker approval

  New trades created by a maker require approval from a checker
  before going live (four-eyes principle). The maker and checker
  operate in fully isolated browser sessions within one scenario.

  Scenario: Maker creates a trade and checker approves it
    Given the maker is on the trade portal
    When the maker creates a new trade:
      | counterparty | ACME Bank                        |
      | portfolio    | FX Derivatives                   |
      | tradeFile    | test-data/trades/trf-sample.json |
    Then the new trade should appear with status "New" and event status "pending approval"
    When the checker approves the trade
    Then the trade should show event status "Approved"
