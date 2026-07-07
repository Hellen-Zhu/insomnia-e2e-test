@checkout
Feature: Shopping Checkout
  As a logged-in user
  I want to add products to the cart and complete checkout
  So that I can purchase what I need

  Background:
    Given I am logged in

  @smoke
  Scenario: Complete purchase flow with a single product
    When I add the product "Sauce Labs Backpack" to the cart
    Then the cart badge count should be 1
    When I open the cart
    Then the cart should contain the product "Sauce Labs Backpack"
    When I checkout as "San" "Zhang" with postal code "100000"
    Then the order should be completed successfully

  Scenario: Add multiple products to the cart
    When I add the product "Sauce Labs Backpack" to the cart
    And I add the product "Sauce Labs Bike Light" to the cart
    Then the cart badge count should be 2
    When I open the cart
    Then the cart should contain 2 items
