import { expect } from '@playwright/test';
import { BaseComponent } from './base.component';

/**
 * 下拉选择组件示例：展示"有交互状态"的组件如何封装。
 *
 * 假定的 DOM 契约（按你们组件库的真实结构调整下方三个定位器即可，
 * 页面对象与用例不需要任何改动）：
 *   - 宿主携带 data-testid，点击宿主展开
 *   - 浮层挂在 body 下（而非宿主内部），带 role="listbox"
 *   - 选项为 role="option"
 */
export class Dropdown extends BaseComponent {
  private overlay() {
    return this.host.page().getByRole('listbox');
  }

  async select(optionText: string): Promise<void> {
    await this.host.click();
    const overlay = this.overlay();
    await expect(overlay).toBeVisible();
    await overlay.getByRole('option', { name: optionText }).click();
    await expect(overlay).toBeHidden();
  }

  async expectSelected(optionText: string): Promise<void> {
    await expect(this.host).toContainText(optionText);
  }
}
