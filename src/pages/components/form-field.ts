import { expect, type Locator } from '@playwright/test';
import { BaseComponent } from './base.component';

/**
 * 表单控件类组件的公共实现：宿主内部包裹一个原生表单控件。
 *
 * 状态断言默认走原生控件的 disabled / aria-disabled（Playwright 的
 * toBeEnabled/toBeDisabled 语义）。如果你们的设计系统禁用时只给宿主
 * 加类名（如 .is-disabled）而不改原生属性，请在具体组件中覆写
 * expectEnabled/expectDisabled，判定逻辑就能收口在一处。
 */
export abstract class FormField extends BaseComponent {
  protected readonly control: Locator;

  constructor(host: Locator, controlSelector: string) {
    super(host);
    this.control = host.locator(controlSelector);
  }

  async fill(value: string): Promise<void> {
    await this.control.fill(value);
  }

  async clear(): Promise<void> {
    await this.control.clear();
  }

  async expectValue(value: string): Promise<void> {
    await expect(this.control).toHaveValue(value);
  }

  async expectEnabled(): Promise<void> {
    await expect(this.control).toBeEnabled();
  }

  async expectDisabled(): Promise<void> {
    await expect(this.control).toBeDisabled();
  }
}

/** Input 组件：testid 在宿主，<input> 在内部 */
export class TextInput extends FormField {
  constructor(host: Locator) {
    super(host, 'input');
  }
}

/** Textarea 组件：testid 在宿主，<textarea> 在内部 */
export class TextArea extends FormField {
  constructor(host: Locator) {
    super(host, 'textarea');
  }
}
