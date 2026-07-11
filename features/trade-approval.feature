@trade
Feature: Trade maker-checker approval

  Approval/rejection is the behaviour under test here — trade creation is
  only a precondition, so it uses a named preset (not bound to any case id)
  and runs as a self-contained Given. Roles are switched within the same
  browser session; runtime data (tradeId) flows between steps through
  the scenario context.

  Scenario: TRADE-101 - Checker approves a pending trade
    Given a "FX_TRF" trade has been created via api
    When the checker approves the trade
    Then the trade is approved and marked as new

  Scenario: TRADE-102 - Checker rejects a pending trade
    Given a "FX_TRF" trade has been created via api
    When the checker rejects the trade
    Then the trade is rejected
