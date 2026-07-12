import { Given, Then } from '../../fixtures/trade-portal.fixtures';

/** 直达 trade portal（登录前置用基座步骤 `Given the "<role>" is logged in`） */
Given('the user is on the trade portal', async ({ tradePortalPage }) => {
  await tradePortalPage.open();
  await tradePortalPage.expectOpened();
});

/** 登录/跳转后的落地断言：URL 含 /trades 且 blotter 渲染完成 */
Then('the trade portal is visible', async ({ tradePortalPage }) => {
  await tradePortalPage.expectLanded();
});
