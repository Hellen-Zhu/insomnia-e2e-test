import type { DataTable } from 'playwright-bdd';
import { env } from '../config/env';
import { getShippingProfile } from '../utils/test-data';
import { Given, When, Then } from './fixtures';

Given('I am logged in', async ({ loginPage, inventoryPage }) => {
  await loginPage.open();
  await loginPage.login(env.username, env.password);
  await inventoryPage.expectOpened();
});

When(
  'I add the product {string} to the cart',
  async ({ inventoryPage, ctx }, productName: string) => {
    await inventoryPage.addProductToCart(productName);
    ctx.addedProducts.push(productName);
  },
);

When(
  'I add the following products to the cart:',
  async ({ inventoryPage, ctx }, table: DataTable) => {
    for (const [productName] of table.raw()) {
      await inventoryPage.addProductToCart(productName);
      ctx.addedProducts.push(productName);
    }
  },
);

Then('the cart badge count should be {int}', async ({ inventoryPage }, count: number) => {
  await inventoryPage.expectCartBadgeCount(count);
});

When('I open the cart', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.openCart();
  await cartPage.expectOpened();
});

Then('the cart should contain the product {string}', async ({ cartPage }, productName: string) => {
  await cartPage.expectContainsProduct(productName);
});

Then('the cart should contain {int} items', async ({ cartPage }, count: number) => {
  await cartPage.expectItemCount(count);
});

Then('the cart should contain all added products', async ({ cartPage, ctx }) => {
  for (const productName of ctx.addedProducts) {
    await cartPage.expectContainsProduct(productName);
  }
});

When(
  'I checkout using the {string} shipping profile',
  async ({ cartPage, checkoutPage }, profileName: string) => {
    const profile = getShippingProfile(profileName);
    await cartPage.startCheckout();
    await checkoutPage.fillShippingInfo(profile.firstName, profile.lastName, profile.postalCode);
    await checkoutPage.confirmOrder();
  },
);

Then('the order should be completed successfully', async ({ checkoutPage }) => {
  await checkoutPage.expectOrderCompleted();
});
