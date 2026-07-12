import { expect } from '@playwright/test';
import { BaseComponent } from '../components/base.component';
import { TextInput, TextArea } from '../components/form-field';

/** 字段分组 tab：feature-editor-group-{group}-btn */
export type FeatureEditorGroup = 'economics' | 'options' | 'parties' | 'schedule' | 'advanced';

/**
 * Feature 编辑器（feature-editor-container）：编辑画布上某个事件的配置。
 * 外层挂在 product-detail-feature-editor-panel 中，由画布节点的 edit 打开。
 *
 * 输入行按字段 id 参数化：feature-editor-input-row-{fieldId}-name-input，
 * fieldId（如 PE-FX-E2E-CO-003-UIT001）是业务数据，应维护在 test-data
 * 并起业务别名，不要硬编码在 step 里。
 */
export class FeatureEditorPanel extends BaseComponent {
  private readonly title = this.host.getByTestId('feature-editor-dialog-title');
  /* 三个下拉按原生 <select> 处理；若为自定义组件改用 components/Combobox */
  private readonly triggerType = this.host.getByTestId('feature-editor-trigger-type-select');
  private readonly formulaType = this.host.getByTestId('feature-editor-formula-type-select');
  private readonly cortexFormula = this.host.getByTestId('feature-editor-cortex-formula-select');
  private readonly formula = new TextArea(this.host.getByTestId('feature-editor-formula-textarea'));
  private readonly saveBtn = this.host.getByTestId('feature-editor-save-btn');
  private readonly closeBtn = this.host.getByTestId('feature-editor-close-btn');

  async expectTitle(text: string): Promise<void> {
    await expect(this.title).toContainText(text);
  }

  /** 分组 tab 按组名参数化（联合类型收口可选集） */
  private groupBtn(group: FeatureEditorGroup) {
    return this.host.getByTestId(`feature-editor-group-${group}-btn`);
  }

  async openGroup(group: FeatureEditorGroup): Promise<void> {
    await this.groupBtn(group).click();
  }

  async selectTriggerType(value: string): Promise<void> {
    await this.triggerType.selectOption(value);
  }

  async selectFormulaType(value: string): Promise<void> {
    await this.formulaType.selectOption(value);
  }

  async selectCortexFormula(value: string): Promise<void> {
    await this.cortexFormula.selectOption(value);
  }

  async fillFormula(expression: string): Promise<void> {
    await this.formula.fill(expression);
  }

  /** 按字段 id 定位输入行，一条声明覆盖任意字段 */
  inputRow(fieldId: string): TextInput {
    return new TextInput(this.host.getByTestId(`feature-editor-input-row-${fieldId}-name-input`));
  }

  async setField(fieldId: string, value: string): Promise<void> {
    await this.inputRow(fieldId).fill(value);
  }

  async save(): Promise<void> {
    await this.saveBtn.click();
  }

  async close(): Promise<void> {
    await this.closeBtn.click();
    await this.expectHidden();
  }
}
