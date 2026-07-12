import { expect } from '@playwright/test';
import { BaseComponent } from '../components/base.component';
import { TextInput, TextArea } from '../components/form-field';

/**
 * Checker 确认弹窗（trade-detail-confirm-checker-action-dialog）。
 * approve 和 reject 共用同一个弹窗，确认动作收口在这里。
 */
export class CheckerConfirmDialog extends BaseComponent {
  private readonly confirmBtn = this.host.getByTestId('trade-detail-checker-confirm-btn');

  async confirm(): Promise<void> {
    await this.expectVisible();
    await this.confirmBtn.click();
    await this.expectHidden();
  }
}

export interface CancellationDetails {
  effectiveDate: string;
  reason: string;
  comments?: string;
}

/**
 * 取消交易弹窗（trade-detail-cancel-dialog）。
 * cancelWith() 是原子动作：填全表单 → 确认 → 等弹窗关闭。
 * 弹窗关闭断言兼作同步点，防止后续步骤在提交完成前继续执行。
 */
export class CancelTradeDialog extends BaseComponent {
  private readonly effectiveDate = new TextInput(
    this.host.getByTestId('trade-detail-effective-date-input'),
  );
  /* reason 按原生 <select> 处理（testid 以 -select 结尾）；若实为自定义组件改用 Combobox */
  private readonly reasonSelect = this.host.getByTestId('trade-detail-cancel-reason-select');
  private readonly comments = new TextArea(
    this.host.getByTestId('trade-detail-cancel-comments-textarea'),
  );
  private readonly confirmBtn = this.host.getByTestId('trade-detail-cancel-dialog-confirm-btn');

  async cancelWith(details: CancellationDetails): Promise<void> {
    await this.expectVisible();
    await this.effectiveDate.fill(details.effectiveDate);
    await this.reasonSelect.selectOption(details.reason);
    if (details.comments) {
      await this.comments.fill(details.comments);
    }
    await this.confirmBtn.click();
    await this.expectHidden();
  }

  async dismiss(): Promise<void> {
    await expect(this.host).toBeVisible();
    await this.host.page().keyboard.press('Escape');
    await this.expectHidden();
  }
}
