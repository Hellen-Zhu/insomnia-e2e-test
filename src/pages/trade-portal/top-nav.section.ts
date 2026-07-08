import { BaseComponent } from '../../components/base.component';

/** 全站顶部导航（layout-*）。若多个页面共享，可提升到 BasePage 组合 */
export class TopNavSection extends BaseComponent {
  private readonly datasourceSelect = this.host.getByTestId('layout-datasource-select');

  async switchDatasource(value: string): Promise<void> {
    await this.datasourceSelect.selectOption(value);
  }

  async toggleTheme(): Promise<void> {
    await this.host.getByTestId('layout-theme-toggle-btn').click();
  }

  async openNotifications(): Promise<void> {
    await this.host.getByTestId('layout-notification-btn').click();
  }

  async openUserMenu(): Promise<void> {
    await this.host.getByTestId('layout-user-menu-btn').click();
  }
}
