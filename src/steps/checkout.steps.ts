import { env } from '../config/env';
import { Given, When, Then } from './fixtures';

Given('我已登录系统', async ({ loginPage, inventoryPage }) => {
  await loginPage.open();
  await loginPage.login(env.username, env.password);
  await inventoryPage.expectOpened();
});

When('我将商品 {string} 加入购物车', async ({ inventoryPage }, productName: string) => {
  await inventoryPage.addProductToCart(productName);
});

Then('购物车角标数量应为 {int}', async ({ inventoryPage }, count: number) => {
  await inventoryPage.expectCartBadgeCount(count);
});

When('我打开购物车', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.openCart();
  await cartPage.expectOpened();
});

Then('购物车中应包含商品 {string}', async ({ cartPage }, productName: string) => {
  await cartPage.expectContainsProduct(productName);
});

Then('购物车中应有 {int} 件商品', async ({ cartPage }, count: number) => {
  await cartPage.expectItemCount(count);
});

When(
  '我以收件人 {string} {string}、邮编 {string} 完成结算',
  async ({ cartPage, checkoutPage }, firstName: string, lastName: string, postalCode: string) => {
    await cartPage.startCheckout();
    await checkoutPage.fillShippingInfo(firstName, lastName, postalCode);
    await checkoutPage.confirmOrder();
  },
);

Then('订单应提交成功', async ({ checkoutPage }) => {
  await checkoutPage.expectOrderCompleted();
});
