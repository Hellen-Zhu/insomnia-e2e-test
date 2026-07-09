import { expect, type Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { BaseComponent } from '../../components/base.component';

/** 审计日志区（audit-log-container）。行级 testid 待补充后扩展 */
class AuditLogSection extends BaseComponent {
  async expectEmpty(): Promise<void> {
    await expect(this.host.getByTestId('audit-log-empty-state')).toBeVisible();
  }
}

/**
 * 产品编排页（product-composer-container，bottom-nav 的 compose tab）。
 * 产品卡片按 id 参数化：product-composer-item-{productId}，
 * 卡片上的编辑按钮为 product-composer-item-{productId}-edit-btn
 * （即此前元素清单中的 {0} 占位符），点击进入 ProductEditPage。
 */
export class ProductComposerPage extends BasePage {
  readonly path = '/compose'; // 按真实路由调整

  private readonly container = this.page.getByTestId('product-composer-container');
  private readonly list = this.page.getByTestId('product-composer-list');
  private readonly toolbar = this.page.getByTestId('product-composer-toolbar');

  readonly auditLog = new AuditLogSection(this.page.getByTestId('audit-log-container'));

  async expectLoaded(): Promise<void> {
    await expect(this.container).toBeVisible();
    await expect(this.list).toBeVisible();
  }

  productCard(productId: string): Locator {
    return this.list.getByTestId(`product-composer-item-${productId}`);
  }

  async expectProductListed(productId: string): Promise<void> {
    await expect(this.productCard(productId)).toBeVisible();
  }

  /** 进入某产品的编辑页（跳转到 ProductEditPage，跨页编排归 flow） */
  async editProduct(productId: string): Promise<void> {
    await this.page.getByTestId(`product-composer-item-${productId}-edit-btn`).click();
  }

  async startProductUpload(): Promise<void> {
    await this.toolbar.getByTestId('product-composer-upload-btn').click();
  }
}
