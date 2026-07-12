@trade @journey
Feature: Trade lifecycle journey (maker to checker)

  Single smoke chain covering the workflow seam the focused suites leave
  open: approval scenarios seed their trades via api, assuming an
  api-created trade is equivalent to a ui-created one for the checker.
  This journey pins that assumption — the maker creates a trade through
  the ui and the checker acts on that same trade in the same session.

  One representative chain only (one product type, one entry point, the
  approve side): product-type and entry-point variation is owned by the
  create-trade and trade-approval suites, so a second journey would add
  runtime without adding coverage. Every step here is reused from those
  suites — this feature defines no vocabulary of its own.

  Scenario: TRADE-201 - A maker-created trade is approved by the checker
    Given the "maker" is logged in
    And the user is on the trade portal
    When the maker creates a "FX_TRF" trade from the case data
    Then the trade is pending approval
    When the checker approves the trade from the blotter
    Then the trade is approved and marked as new
