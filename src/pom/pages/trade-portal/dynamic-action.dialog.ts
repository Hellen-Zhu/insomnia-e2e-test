import { expect, type Locator } from '@playwright/test';
import { BaseComponent } from '../../components/base.component';
import { TextInput } from '../../components/form-field';

export type MarketerRole = 'coverage' | 'execution';

/**
 * 动态操作弹窗（dynamic-action-dialog）：blotter 行操作（部分终止 / 提前终止 /
 * novation / 组合调仓 / allocation 等）共用同一个弹窗，字段随操作类型动态渲染。
 *
 * 字段 testid 全部遵循参数化模式，因此不按操作类型登记字段：
 *   文本:  dynamic-action-{field}-input        （newNotional / amount / ar-ci ...）
 *   日期:  dynamic-action-{field}-date-input   （terminationDate / settleDate ...）
 *   下拉:  dynamic-action-{field}-select       （portfolio / direction ...）
 * field 名是业务数据，随场景传入；各操作类型的常用字段组合收敛到 test-data。
 * 注意 field 命名本身不统一（newNotional 驼峰 vs ar-ci kebab），建议反馈前端。
 */
export class DynamicActionDialog extends BaseComponent {
  private readonly loading = this.host.getByTestId('dynamic-action-loading-state');
  private readonly userInputs = this.host.getByTestId('dynamic-action-user-inputs-container');

  /** 打开后先等动态字段渲染完成（loading 消失、输入区就位）再操作 */
  async waitUntilReady(): Promise<void> {
    await this.expectVisible();
    await expect(this.loading).toBeHidden();
    await expect(this.userInputs).toBeVisible();
  }

  input(field: string): TextInput {
    return new TextInput(this.host.getByTestId(`dynamic-action-${field}-input`));
  }

  dateInput(field: string): TextInput {
    return new TextInput(this.host.getByTestId(`dynamic-action-${field}-date-input`));
  }

  /* -select 按原生 <select> 处理；若为自定义组件改用 components/Combobox */
  private select(field: string): Locator {
    return this.host.getByTestId(`dynamic-action-${field}-select`);
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

  /* marketer 成对出现：dynamic-action-{role}-marketer-select + -marketer-pct-input */
  async selectMarketer(role: MarketerRole, name: string): Promise<void> {
    await this.host.getByTestId(`dynamic-action-${role}-marketer-select`).selectOption(name);
  }

  async setMarketerPct(role: MarketerRole, pct: string): Promise<void> {
    await new TextInput(
      this.host.getByTestId(`dynamic-action-${role}-marketer-pct-input`),
    ).fill(pct);
  }

  /** 部分 novation 的名义金额等式（testid 缺 dynamic-action 前缀，建议反馈前端） */
  async expectNotionalEquation(text: string): Promise<void> {
    await expect(
      this.host.getByTestId('partial-novation-notional-equation-value'),
    ).toContainText(text);
  }

  async expectNotionalSummaryVisible(): Promise<void> {
    await expect(
      this.host.getByTestId('partial-novation-notional-summary-container'),
    ).toBeVisible();
  }

  /** 确认后通常接 TradeChangeConfirmationDialog，由 flow 编排后续 */
  async confirm(): Promise<void> {
    await this.host.getByTestId('dynamic-action-confirm-btn').click();
  }

  async skipRisk(): Promise<void> {
    await this.host.getByTestId('dynamic-action-skip-risk-btn').click();
  }

  async dismiss(): Promise<void> {
    await this.host.getByTestId('dynamic-action-cancel-btn').click();
    await this.expectHidden();
  }
}
