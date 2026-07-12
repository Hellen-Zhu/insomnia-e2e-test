@login
Feature: User Login
  As a user
  I want to log into the system
  So that I can access my workspace

  Background:
    Given the user is on the login page

  @smoke
  Scenario: Login successfully with a valid role
    When the user logs in as "maker"
    Then the trade portal is visible

  Scenario Outline: Login fails with invalid credentials
    When the user logs in with username "<username>" and password "<password>"
    Then the error message "<error_message>" is shown

    Examples:
      | username        | password       | error_message                         |
      | standard_user   | wrong_password | Username and password do not match    |
      | locked_out_user | secret_sauce   | Sorry, this user has been locked out. |
      |                 | secret_sauce   | Username is required                  |
