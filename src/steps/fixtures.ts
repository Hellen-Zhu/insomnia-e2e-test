import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { LoginFlow } from '../flows/login.flow';
import { CheckoutFlow } from '../flows/checkout.flow';
import { UserApi } from '../api/user.api';
import { env } from '../config/env';
import type { APIRequestContext } from '@playwright/test';

/**
 * 场景上下文：同一场景内跨步骤传递运行时产生的数据。
 *
 * test 作用域 fixture 保证：每个场景一个全新实例（步骤间共享），
 * 场景之间/并行 worker 之间互不可见（数据隔离）。
 * 禁止用 steps 文件里的模块级变量共享状态——那会在同一 worker
 * 的场景之间泄漏，是并行模式下最典型的 flaky 来源。
 *
 * 需要传递新数据时在此类上加类型化字段，不要用 any/Map 逃逸类型检查。
 */
export class ScenarioContext {
  /** 本场景中已加入购物车的商品名 */
  readonly addedProducts: string[] = [];

  private readonly cleanups: Array<() => Promise<void>> = [];

  /** 登记清理动作（通常在 API 造数后立刻登记），场景结束后自动执行 */
  addCleanup(cleanup: () => Promise<void>): void {
    this.cleanups.push(cleanup);
  }

  /** 由 After hook 调用：按登记的逆序清理，单条失败不阻断其余清理 */
  async runCleanups(): Promise<void> {
    for (const cleanup of this.cleanups.reverse()) {
      try {
        await cleanup();
      } catch (error) {
        console.warn('Cleanup failed (continuing):', error);
      }
    }
  }
}

/**
 * POM 依赖注入中心。
 *
 * 步骤定义在参数中声明需要的页面对象（如 `async ({ loginPage }) => ...`），
 * Playwright 按需懒加载实例化。新增页面对象只需：
 *   1. 在 src/pages/ 下创建页面类
 *   2. 在下方 fixtures 中注册一行
 */
type PageFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  loginFlow: LoginFlow;
  checkoutFlow: CheckoutFlow;
  apiContext: APIRequestContext;
  userApi: UserApi;
  ctx: ScenarioContext;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  /* Flow 依赖 Page fixture 组装，同样按场景实例化 */
  loginFlow: async ({ loginPage, inventoryPage }, use) =>
    use(new LoginFlow(loginPage, inventoryPage)),
  checkoutFlow: async ({ cartPage, checkoutPage }, use) =>
    use(new CheckoutFlow(cartPage, checkoutPage)),
  /* API 造数：独立于浏览器的 HTTP 上下文（可配 API_BASE_URL 与鉴权头） */
  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: env.apiBaseUrl });
    await use(apiContext);
    await apiContext.dispose();
  },
  userApi: async ({ apiContext }, use) => use(new UserApi(apiContext)),
  ctx: async ({}, use) => use(new ScenarioContext()),
});

export const { Given, When, Then } = createBdd(test);
