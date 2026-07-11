@trade
Feature: Trade maker-checker approval

  Approval/rejection is the behaviour under test here — trade creation is
  only a precondition, so it uses a named preset (not bound to any case id)
  and runs as a self-contained Given. Roles are switched within the same
  browser session; runtime data (tradeId) flows between steps through
  the scenario context.

  The checker has two independent UI entry points for the same verdict:
  the blotter row menu and the trade details page (different buttons and
  different confirm dialogs). The entry point is named in the When step;
  the business outcome does not depend on it, so the Then phrases are shared.

  Scenario: TRADE-101 - Checker approves a pending trade from the blotter
    Given a "FX_TRF" trade has been created via api
    When the checker approves the trade from the blotter
    Then the trade is approved and marked as new

  Scenario: TRADE-102 - Checker rejects a pending trade from the blotter
    Given a "FX_TRF" trade has been created via api
    When the checker rejects the trade from the blotter
    Then the trade is rejected and marked as new

  Scenario: TRADE-103 - Checker approves a pending trade from the trade details page
    Given a "FX_TRF" trade has been created via api
    When the checker approves the trade from the trade details page
    Then the trade is approved and marked as new

  Scenario: TRADE-104 - Checker rejects a pending trade from the trade details page
    Given a "FX_TRF" trade has been created via api
    When the checker rejects the trade from the trade details page
    Then the trade is rejected and marked as new
