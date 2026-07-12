import { expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { TextArea } from '../../components/form-field';
import { EventCanvasSection } from './event-canvas.section';
import { FeatureEditorPanel } from './feature-editor.panel';
import { ExtractedFieldsModal } from './extracted-fields-modal';
import { SchemaUploadPanel, SchemaHistoryDialog } from './schema-upload.panel';

/**
 * 产品编辑页（product-page）。
 *
 * 65 条元素清单收敛为：事件画布 + feature 编辑器 + 提取字段弹窗
 * + schema 上传面板（含历史弹窗）+ 页面级表单与动作。
 * 清单中 event_trigger_type 与 feature_editor_trigger_type 是同一
 * testid 的重复登记（JSON 仓库漂移），此处只建模一次。
 */
export class ProductEditPage extends BasePage {
  readonly path = '/products'; // 按真实路由调整

  private readonly loading = this.page.getByTestId('product-detail-page-loading-state');
  private readonly container = this.page.getByTestId('product-page');
  private readonly basicInfoCard = this.page.getByTestId('product-detail-form-basic-info-card');
  /* testid 缺 product 前缀（field-description），建议随其他命名问题一起反馈前端 */
  private readonly description = new TextArea(this.page.getByTestId('field-description'));
  private readonly editFieldsBtn = this.page.getByTestId('product-detail-edit-fields-button');
  private readonly schemaHistoryBtn = this.page.getByTestId('product-schema-history-btn');
  private readonly saveBtn = this.page.getByTestId('product-save-btn');
  /** 清单中命名为 back，实际 testid 是 product-cancel-btn */
  private readonly cancelBtn = this.page.getByTestId('product-cancel-btn');

  readonly canvas = new EventCanvasSection(this.page.getByTestId('event-canvas-drop-area'));
  readonly featureEditor = new FeatureEditorPanel(
    this.page.getByTestId('feature-editor-container'),
  );
  readonly extractedFields = new ExtractedFieldsModal(
    this.page.getByTestId('extracted-fields-preview-modal'),
  );
  readonly schemaUpload = new SchemaUploadPanel(this.page.getByTestId('schema-upload-panel'));
  readonly schemaHistory = new SchemaHistoryDialog(this.page.getByTestId('schema-history-dialog'));

  /** SPA 加载态：等 loading 消失、容器就位后再操作 */
  async waitUntilLoaded(): Promise<void> {
    await expect(this.loading).toBeHidden();
    await expect(this.container).toBeVisible();
    await expect(this.basicInfoCard).toBeVisible();
  }

  async setDescription(text: string): Promise<void> {
    await this.description.fill(text);
  }

  /** 打开提取字段编辑弹窗 */
  async openFieldsEditor(): Promise<void> {
    await this.editFieldsBtn.click();
    await this.extractedFields.expectVisible();
  }

  async openSchemaHistory(): Promise<void> {
    await this.schemaHistoryBtn.click();
    await this.schemaHistory.expectVisible();
  }

  async save(): Promise<void> {
    await this.saveBtn.click();
  }

  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }
}
