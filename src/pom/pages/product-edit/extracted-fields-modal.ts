import { BaseComponent } from '../../components/base.component';
import { TextInput } from '../../components/form-field';

/**
 * 提取字段预览弹窗（extracted-fields-preview-modal）。
 * 两个入口共用：产品编辑页的 edit-fields 按钮、schema 上传的字段预览。
 * 行 testid 为 extracted-fields-preview-field-row（同名多行），按序号访问。
 */
export class ExtractedFieldsModal extends BaseComponent {
  private readonly rows = this.host.getByTestId('extracted-fields-preview-field-row');
  private readonly saveChangesBtn = this.host.getByTestId(
    'extracted-fields-preview-save-changes-btn',
  );

  /** 修改第 index 行的 display label（行内首个 input；有更细 testid 后替换） */
  async setDisplayLabel(index: number, value: string): Promise<void> {
    await new TextInput(this.rows.nth(index)).fill(value);
  }

  async saveChanges(): Promise<void> {
    await this.saveChangesBtn.click();
    await this.expectHidden();
  }
}
