import { expect } from '@playwright/test';
import { BaseComponent } from '../../components/base.component';
import { TextInput } from '../../components/form-field';

/**
 * Instrument 树区域（instrument-tree-container）。
 *
 * 树内所有输入框遵循同一 testid 模式：
 *   instrument-tree-{fieldPath}-input
 * 例如 TRF 的 TD BigFigure：
 *   instrument-tree-TRF.targetCGain.TD_BigFigure.td_bf-input
 * 因此不逐个登记字段，一个 field(path) 覆盖任意产品、任意深度的字段。
 * fieldPath 常量建议按产品收敛到 test-data 或专门的 constants 文件，
 * 避免散落在 step 里。
 */
export class InstrumentSection extends BaseComponent {
  /** trade-type 与 details-panel 在树容器之外，从 page 级定位 */
  private readonly tradeType = this.host.page().getByTestId('instrument-trade-type');
  private readonly detailsPanel = this.host
    .page()
    .getByTestId('trade-detail-instrument-details-panel');

  field(fieldPath: string): TextInput {
    return new TextInput(this.host.getByTestId(`instrument-tree-${fieldPath}-input`));
  }

  async setField(fieldPath: string, value: string): Promise<void> {
    await this.field(fieldPath).fill(value);
  }

  async expectField(fieldPath: string, value: string): Promise<void> {
    await this.field(fieldPath).expectValue(value);
  }

  async expectTradeType(type: string): Promise<void> {
    await expect(this.tradeType).toHaveText(type);
  }

  async expectDetailsPanelVisible(): Promise<void> {
    await expect(this.detailsPanel).toBeVisible();
  }
}
