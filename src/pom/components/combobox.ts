import { expect } from '@playwright/test';
import { BaseComponent } from './base.component';

/**
 * Combobox 组件（非标准下拉：无原生 <select>、无 ARIA 角色）。
 * testid 在触发器宿主上，交互为两步：
 *   1. 点击宿主，打开选项面板（面板挂在 body 下，不在宿主内部）
 *   2. 点击目标选项
 *
 * 选项暂按精确可见文本定位。若选项文本可能与页面其他文本重名，
 * 让前端给 option 加 testid（如 {combobox}-option-{value}），
 * 把 option() 收窄为 getByTestId 模式——只需改这一个方法。
 */
export class Combobox extends BaseComponent {
  private option(text: string) {
    return this.host.page().getByText(text, { exact: true });
  }

  async select(optionText: string): Promise<void> {
    await this.host.click();
    await this.option(optionText).click();
    await this.expectSelected(optionText);
  }

  /** 选中后触发器显示所选值——兼作面板收起/值生效的同步点 */
  async expectSelected(optionText: string): Promise<void> {
    await expect(this.host).toContainText(optionText);
  }
}
