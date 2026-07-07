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
    When I checkout using the "default" shipping profile
    Then the order should be completed successfully

  Scenario: Add multiple products to the cart
    When I add the following products to the cart:
      | Sauce Labs Backpack   |
      | Sauce Labs Bike Light |
    Then the cart badge count should be 2
    When I open the cart
    Then the cart should contain 2 items
