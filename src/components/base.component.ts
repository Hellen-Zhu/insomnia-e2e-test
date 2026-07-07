import { expect, type Locator } from '@playwright/test';

/**
 * 设计系统组件对象的基类。
 *
 * 适用场景：data-testid 打在组件宿主元素上，真实的交互元素（input/textarea 等）
 * 在宿主内部。"宿主 → 内部元素"的映射知识只允许存在于组件类中，页面对象不感知。
 *
 * 构造参数接收 Locator 而非 testid 字符串，因此天然支持嵌套定位，
 * 例如表格某一行里的输入框：new TextInput(row.getByTestId('qty'))
 */
export abstract class BaseComponent {
  constructor(protected readonly host: Locator) {}

  async expectVisible(): Promise<void> {
    await expect(this.host).toBeVisible();
  }

  async expectHidden(): Promise<void> {
    await expect(this.host).toBeHidden();
  }
}
