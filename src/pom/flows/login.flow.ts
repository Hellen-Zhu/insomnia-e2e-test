import { credentialsFor } from '../../config/users';
import type { LoginPage } from '../pages/login.page';
import type { TradePortalPage } from '../pages/trade-portal/trade-portal.page';

/**
 * UI 登录流程：登录页 → 提交角色凭证 → 等 trade portal 就绪。
 * 流程末尾的落地断言（URL + blotter 渲染完成）保证后续步骤开始时页面已就绪。
 * 应用暂不支持会话注入/缓存，所有登录前置都走本流程；将来支持后在此收口。
 */
export class LoginFlow {
  constructor(
    private readonly loginPage: LoginPage,
    private readonly tradePortalPage: TradePortalPage,
  ) {}

  async loginAs(role: string): Promise<void> {
    await this.loginPage.open();
    const { username, password } = credentialsFor(role);
    await this.loginPage.login(username, password);
    await this.tradePortalPage.expectLanded();
  }
}
