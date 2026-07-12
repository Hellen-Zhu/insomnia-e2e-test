import { expect } from '@playwright/test';
import { BaseComponent } from '../components/base.component';

export type BottomNavTab = 'trades' | 'compose';

/** 全站底部导航（nav-{tab}-tab 模式，参数化覆盖后续新增 tab） */
export class BottomNavSection extends BaseComponent {
  private tab(name: BottomNavTab) {
    return this.host.getByTestId(`nav-${name}-tab`);
  }

  async goTo(tabName: BottomNavTab): Promise<void> {
    await this.tab(tabName).click();
  }

  async expectActiveTab(tabName: BottomNavTab): Promise<void> {
    // 按你们组件的激活态标记调整（aria-selected / class）
    await expect(this.tab(tabName)).toHaveAttribute('aria-selected', 'true');
  }
}
