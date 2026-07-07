import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  readonly path = '/cart.html';

  private readonly itemNames = this.page.locator('[data-test="inventory-item-name"]');
  private readonly checkoutButton = this.page.locator('[data-test="checkout"]');

  async expectContainsProduct(productName: string): Promise<void> {
    await expect(this.itemNames.filter({ hasText: productName })).toBeVisible();
  }

  async expectItemCount(count: number): Promise<void> {
    await expect(this.itemNames).toHaveCount(count);
  }

  async startCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
