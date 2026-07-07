import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class InventoryPage extends BasePage {
  readonly path = '/inventory.html';

  private readonly cartBadge = this.page.locator('[data-test="shopping-cart-badge"]');
  private readonly cartLink = this.page.locator('[data-test="shopping-cart-link"]');

  /** 按商品名定位商品卡片，避免依赖 add-to-cart-xxx 这类拼接 id */
  private productCard(productName: string) {
    return this.page
      .locator('[data-test="inventory-item"]')
      .filter({ hasText: productName });
  }

  async addProductToCart(productName: string): Promise<void> {
    await this.productCard(productName).getByRole('button', { name: 'Add to cart' }).click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async expectCartBadgeCount(count: number): Promise<void> {
    await expect(this.cartBadge).toHaveText(String(count));
  }
}
