import type { LoginPage } from '../pages/login.page';
import type { InventoryPage } from '../pages/inventory.page';

/**
 * 登录业务流程：跨页面（登录页 → 商品页）的编排。
 *
 * Flow 层的纪律：
 *   - 只编排 Page，自己不持有任何定位器
 *   - 不感知 Gherkin（可被 steps 复用，也可被其他 flow 复用）
 *   - 流程末尾负责"到达断言"，保证调用方拿到的是确定状态
 */
export class LoginFlow {
  constructor(
    private readonly loginPage: LoginPage,
    private readonly inventoryPage: InventoryPage,
  ) {}

  /** 完整登录流程：打开登录页 → 提交凭证 → 确认到达商品页 */
  async loginAs(username: string, password: string): Promise<void> {
    await this.loginPage.open();
    await this.loginPage.login(username, password);
    await this.inventoryPage.expectOpened();
  }
}
