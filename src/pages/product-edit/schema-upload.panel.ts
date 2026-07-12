import { expect, type Locator } from '@playwright/test';
import { BaseComponent } from '../components/base.component';
import { TextInput } from '../components/form-field';

/**
 * Schema 上传面板（schema-upload-panel）。
 * 主路径：选文件 → 预览解析 → 填变更摘要 → 确认保存 → 成功提示。
 * 分支：版本已存在时出现 warning，由调用方决定覆盖或放弃——
 * 分支判断属于业务流程，故这里只提供原子动作和断言，不隐藏分支。
 */
export class SchemaUploadPanel extends BaseComponent {
  private readonly fileInput = this.host.getByTestId('schema-file-input');
  private readonly parsedInfo = this.host.getByTestId('schema-parsed-info');
  private readonly changeSummary = new TextInput(
    this.host.getByTestId('schema-change-summary-input'),
  );
  private readonly versionWarning = this.host.getByTestId('schema-version-exists-warning');
  private readonly previewBtn = this.host.getByTestId('schema-upload-preview-btn');
  private readonly extractedFieldsPreviewBtn = this.host.getByTestId(
    'schema-extracted-fields-preview-btn',
  );
  private readonly confirmSaveBtn = this.host.getByTestId('schema-confirm-save-btn');
  private readonly cancelBtn = this.host.getByTestId('schema-cancel-btn');
  private readonly successMessage = this.host.getByTestId('schema-upload-success');
  private readonly overrideConfirmBtn = this.host.getByTestId('schema-override-confirm-btn');
  private readonly overrideCancelBtn = this.host.getByTestId('schema-override-cancel-btn');

  /** 若 testid 打在包装元素而非 <input type=file> 上，改为 .locator('input[type=file]') */
  async chooseSchemaFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  /** 预览并等解析结果出现（解析是异步的，parsed-info 兼作同步点） */
  async preview(): Promise<void> {
    await this.previewBtn.click();
    await expect(this.parsedInfo).toBeVisible();
  }

  async openExtractedFieldsPreview(): Promise<void> {
    await this.extractedFieldsPreviewBtn.click();
  }

  async saveWithSummary(summary: string): Promise<void> {
    await this.changeSummary.fill(summary);
    await this.confirmSaveBtn.click();
  }

  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }

  async expectSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
  }

  async expectVersionExistsWarning(): Promise<void> {
    await expect(this.versionWarning).toBeVisible();
  }

  async confirmOverride(): Promise<void> {
    await this.overrideConfirmBtn.click();
  }

  async cancelOverride(): Promise<void> {
    await this.overrideCancelBtn.click();
  }
}

/**
 * Schema 历史弹窗（schema-history-dialog），由产品页的 history 按钮打开。
 * 行 testid 为 schema-history-row-{index}（清单中的 {0} 占位符即此参数）。
 */
export class SchemaHistoryDialog extends BaseComponent {
  row(index: number): Locator {
    return this.host.getByTestId(`schema-history-row-${index}`);
  }

  async expectRowContains(index: number, text: string): Promise<void> {
    await expect(this.row(index)).toContainText(text);
  }
}
