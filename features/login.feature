@login
Feature: User Login
  As a user
  I want to log into the system
  So that I can access my workspace

  Background:
    Given I am on the login page

  @smoke
  Scenario: Login successfully with a valid role
    When I login as "maker"
    Then I should land on the trade portal

  Scenario Outline: Login fails with invalid credentials
    When I login with username "<username>" and password "<password>"
    Then I should see the error message "<error_message>"

    Examples:
      | username        | password       | error_message                         |
      | standard_user   | wrong_password | Username and password do not match    |
      | locked_out_user | secret_sauce   | Sorry, this user has been locked out. |
      |                 | secret_sauce   | Username is required                  |
