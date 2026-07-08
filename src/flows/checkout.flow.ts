import type { CartPage } from '../pages/cart.page';
import type { CheckoutPage } from '../pages/checkout.page';
import type { ShippingProfile } from '../utils/test-data';

/**
 * 结算业务流程：购物车页 → 结算页 → 下单完成的编排。
 */
export class CheckoutFlow {
  constructor(
    private readonly cartPage: CartPage,
    private readonly checkoutPage: CheckoutPage,
  ) {}

  /** 从购物车页出发，用指定收件信息完成下单 */
  async checkoutWith(profile: ShippingProfile): Promise<void> {
    await this.cartPage.startCheckout();
    await this.checkoutPage.fillShippingInfo(
      profile.firstName,
      profile.lastName,
      profile.postalCode,
    );
    await this.checkoutPage.confirmOrder();
  }
}
