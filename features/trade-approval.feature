@trade
Feature: Trade maker-checker approval

  Approval is the behaviour under test here — trade creation is only a
  precondition, so it uses a named preset (not bound to any case id) and
  runs as a self-contained Given. Roles are switched within the same
  browser session; runtime data (tradeId) flows between steps through
  the scenario context.

  Scenario: TRADE-101 - Checker approves a pending trade
    Given a "FX_TRF" trade has been created
    When the checker approves the trade
    Then the trade should show event status "Approved"
