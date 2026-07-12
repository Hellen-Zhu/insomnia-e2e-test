import { expect, type Locator } from '@playwright/test';
import { BaseComponent } from './base.component';
import { TextInput } from './form-field';

export type MarketerRole = 'coverage' | 'execution';

/**
 * 动态操作弹窗（dynamic-action-dialog）：前端用同一个组件承载多种行操作
 * （部分终止 / 提前终止 / novation / 组合调仓 / allocation 等），
 * 字段随操作类型动态渲染。本类只登记该组件的 testid 语法与固定骨架，
 * **零业务知识**——field 名是运行时数据，随场景传入；
 * 各操作类型的常用字段组合收敛到 test-data。
 * 动作特有的补充元素（如 partial novation 的名义金额区）由页面侧子类扩展。
 *
 * 注意 field 命名本身不统一（newNotional 驼峰 vs ar-ci kebab），建议反馈前端。
 */
export class DynamicActionModal extends BaseComponent {
  /** testid 语法契约（与前端 dynamic-action 组件一一对应，前端改名只改这里） */
  protected static readonly TID = {
    input: (field: string) => `dynamic-action-${field}-input`,
    dateInput: (field: string) => `dynamic-action-${field}-date-input`,
    select: (field: string) => `dynamic-action-${field}-select`,
    /* marketer 成对出现：select 选人 + pct-input 分成 */
    marketer: (role: MarketerRole) => `dynamic-action-${role}-marketer-select`,
    marketerPct: (role: MarketerRole) => `dynamic-action-${role}-marketer-pct-input`,
  };

  private readonly loading = this.host.getByTestId('dynamic-action-loading-state');
  private readonly userInputs = this.host.getByTestId('dynamic-action-user-inputs-container');
  private readonly confirmBtn = this.host.getByTestId('dynamic-action-confirm-btn');
  private readonly skipRiskBtn = this.host.getByTestId('dynamic-action-skip-risk-btn');
  private readonly cancelBtn = this.host.getByTestId('dynamic-action-cancel-btn');

  /** 打开后先等动态字段渲染完成（loading 消失、输入区就位）再操作 */
  async waitUntilReady(): Promise<void> {
    await this.expectVisible();
    await expect(this.loading).toBeHidden();
    await expect(this.userInputs).toBeVisible();
  }

  input(field: string): TextInput {
    return new TextInput(this.host.getByTestId(DynamicActionModal.TID.input(field)));
  }

  dateInput(field: string): TextInput {
    return new TextInput(this.host.getByTestId(DynamicActionModal.TID.dateInput(field)));
  }

  /* -select 按原生 <select> 处理；若为自定义组件改用 components/Combobox */
  private select(field: string): Locator {
    return this.host.getByTestId(DynamicActionModal.TID.select(field));
  }

  async setField(field: string, value: string): Promise<void> {
    await this.input(field).fill(value);
  }

  async setDate(field: string, value: string): Promise<void> {
    await this.dateInput(field).fill(value);
  }

  async selectOption(field: string, value: string): Promise<void> {
    await this.select(field).selectOption(value);
  }

  private marketerSelect(role: MarketerRole): Locator {
    return this.host.getByTestId(DynamicActionModal.TID.marketer(role));
  }

  private marketerPctInput(role: MarketerRole): TextInput {
    return new TextInput(this.host.getByTestId(DynamicActionModal.TID.marketerPct(role)));
  }

  async selectMarketer(role: MarketerRole, name: string): Promise<void> {
    await this.marketerSelect(role).selectOption(name);
  }

  async setMarketerPct(role: MarketerRole, pct: string): Promise<void> {
    await this.marketerPctInput(role).fill(pct);
  }

  /** 确认后通常接后续确认弹窗（如 TradeChangeConfirmationDialog），由 flow 编排 */
  async confirm(): Promise<void> {
    await this.confirmBtn.click();
  }

  async skipRisk(): Promise<void> {
    await this.skipRiskBtn.click();
  }

  async dismiss(): Promise<void> {
    await this.cancelBtn.click();
    await this.expectHidden();
  }
}
