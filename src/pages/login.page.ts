import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly path = '/';

  private readonly usernameInput = this.page.locator('[data-test="username"]');
  private readonly passwordInput = this.page.locator('[data-test="password"]');
  private readonly loginButton = this.page.locator('[data-test="login-button"]');
  private readonly errorMessage = this.page.locator('[data-test="error"]');

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }

  /** 登录成功的落地断言。saucedemo 落在 inventory；真实项目换成你们的落地页 URL */
  async expectLoginSucceeded(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory\.html$/);
  }
}
