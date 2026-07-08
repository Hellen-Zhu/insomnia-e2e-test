import { BasePage } from './base.page';

/**
 * saucedemo 登录成功后的落地页。
 * 仅用于登录流程的到达断言（expectOpened 继承自 BasePage）；
 * 真实项目中把落地断言换成你们登录后跳转的页面（如 TradePortalPage）。
 */
export class InventoryPage extends BasePage {
  readonly path = '/inventory.html';
}
