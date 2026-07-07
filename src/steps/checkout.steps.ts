import { env } from '../config/env';
import { Given, When, Then } from './fixtures';

Given('I am logged in', async ({ loginPage, inventoryPage }) => {
  await loginPage.open();
  await loginPage.login(env.username, env.password);
  await inventoryPage.expectOpened();
});

When('I add the product {string} to the cart', async ({ inventoryPage }, productName: string) => {
  await inventoryPage.addProductToCart(productName);
});

Then('the cart badge count should be {int}', async ({ inventoryPage }, count: number) => {
  await inventoryPage.expectCartBadgeCount(count);
});

When('I open the cart', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.openCart();
  await cartPage.expectOpened();
});

Then(
  'the cart should contain the product {string}',
  async ({ cartPage }, productName: string) => {
    await cartPage.expectContainsProduct(productName);
  },
);

Then('the cart should contain {int} items', async ({ cartPage }, count: number) => {
  await cartPage.expectItemCount(count);
});

When(
  'I checkout as {string} {string} with postal code {string}',
  async ({ cartPage, checkoutPage }, firstName: string, lastName: string, postalCode: string) => {
    await cartPage.startCheckout();
    await checkoutPage.fillShippingInfo(firstName, lastName, postalCode);
    await checkoutPage.confirmOrder();
  },
);

Then('the order should be completed successfully', async ({ checkoutPage }) => {
  await checkoutPage.expectOrderCompleted();
});
