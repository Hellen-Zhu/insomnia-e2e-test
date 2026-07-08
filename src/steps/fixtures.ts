import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { TradePortalPage } from '../pages/trade-portal/trade-portal.page';
import { TradeDetailPage } from '../pages/trade-detail/trade-detail.page';
import { NewTradePage } from '../pages/new-trade/new-trade.page';
import { LoginFlow } from '../flows/login.flow';
import { CheckoutFlow } from '../flows/checkout.flow';
import { TradeFlow } from '../flows/trade.flow';
import { UserApi } from '../api/user.api';
import { env } from '../config/env';
import type { APIRequestContext, Browser, BrowserContextOptions, Page } from '@playwright/test';

type StorageState = BrowserContextOptions['storageState'];

/** 构造某账号的已登录会话（真实项目：改为调登录 API 换 token 后组装） */
function sessionStateFor(username: string): StorageState {
  return {
    cookies: [
      {
        name: 'session-username',
        value: username,
        domain: new URL(env.baseUrl).hostname,
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: true,
        sameSite: 'Lax' as const,
      },
    ],
    origins: [],
  };
}

/**
 * 角色会话：多角色场景（maker/checker 四眼审批等）中，每个角色一个
 * 独立的 browser context（登录态完全隔离）+ 该角色使用的页面对象集。
 * saucedemo 页面留作演示；真实项目只保留 trade 系列即可。
 */
export class RoleSession {
  readonly inventoryPage: InventoryPage;
  readonly cartPage: CartPage;
  readonly tradePortalPage: TradePortalPage;
  readonly tradeDetailPage: TradeDetailPage;
  readonly newTradePage: NewTradePage;
  readonly tradeFlow: TradeFlow;

  constructor(readonly page: Page) {
    this.inventoryPage = new InventoryPage(page);
    this.cartPage = new CartPage(page);
    this.tradePortalPage = new TradePortalPage(page);
    this.tradeDetailPage = new TradeDetailPage(page);
    this.newTradePage = new NewTradePage(page);
    this.tradeFlow = new TradeFlow(this.tradePortalPage, this.newTradePage);
  }
}

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

  /** maker 创建交易后从接口响应捕获的 tradeId */
  tradeId?: string;

  /** 读取 tradeId，未写入时给出可诊断的错误而非静默 undefined */
  requireTradeId(): string {
    if (!this.tradeId) {
      throw new Error('ctx.tradeId is empty — did the create-trade step run before this one?');
    }
    return this.tradeId;
  }

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
  tradePortalPage: TradePortalPage;
  tradeDetailPage: TradeDetailPage;
  newTradePage: NewTradePage;
  loginFlow: LoginFlow;
  checkoutFlow: CheckoutFlow;
  tradeFlow: TradeFlow;
  apiContext: APIRequestContext;
  userApi: UserApi;
  maker: RoleSession;
  checker: RoleSession;
  ctx: ScenarioContext;
};

/** 为指定账号开一个独立的已登录 browser context（多角色场景用） */
async function newRoleSession(browser: Browser, username: string) {
  const context = await browser.newContext({
    baseURL: env.baseUrl,
    storageState: sessionStateFor(username),
  });
  const page = await context.newPage();
  return { session: new RoleSession(page), context };
}

type WorkerFixtures = {
  workerStorageState: StorageState;
};

export const test = base.extend<PageFixtures, WorkerFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  tradePortalPage: async ({ page }, use) => use(new TradePortalPage(page)),
  tradeDetailPage: async ({ page }, use) => use(new TradeDetailPage(page)),
  newTradePage: async ({ page }, use) => use(new NewTradePage(page)),
  /* Flow 依赖 Page fixture 组装，同样按场景实例化 */
  loginFlow: async ({ loginPage, inventoryPage }, use) =>
    use(new LoginFlow(loginPage, inventoryPage)),
  checkoutFlow: async ({ cartPage, checkoutPage }, use) =>
    use(new CheckoutFlow(cartPage, checkoutPage)),
  tradeFlow: async ({ tradePortalPage, newTradePage }, use) =>
    use(new TradeFlow(tradePortalPage, newTradePage)),
  /* API 造数：独立于浏览器的 HTTP 上下文（可配 API_BASE_URL 与鉴权头） */
  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: env.apiBaseUrl });
    await use(apiContext);
    await apiContext.dispose();
  },
  userApi: async ({ apiContext }, use) => use(new UserApi(apiContext)),
  /* 多角色会话：各自独立 context，场景内可同时存活、交替操作 */
  maker: async ({ browser }, use) => {
    const { session, context } = await newRoleSession(browser, env.makerUsername);
    await use(session);
    await context.close();
  },
  checker: async ({ browser }, use) => {
    const { session, context } = await newRoleSession(browser, env.checkerUsername);
    await use(session);
    await context.close();
  },
  ctx: async ({}, use) => use(new ScenarioContext()),

  /**
   * worker 级认证复用：每个 worker 进程只构建一次会话，本 worker 的所有场景共享。
   *
   * 真实项目在此处调用登录 API 换 token（用 playwright.request），再组装成
   * cookies/localStorage。saucedemo 的会话就是一个 cookie，直接构造。
   * 多账号隔离时按 workerInfo.parallelIndex 分配账号。
   */
  workerStorageState: [
    async ({}, use) => {
      await use({
        cookies: [
          {
            name: 'session-username',
            value: env.username,
            domain: new URL(env.baseUrl).hostname,
            path: '/',
            expires: -1,
            httpOnly: false,
            secure: true,
            sameSite: 'Lax' as const,
          },
        ],
        origins: [],
      });
    },
    { scope: 'worker' },
  ],

  /**
   * 场景的浏览器上下文默认携带已登录会话（storageState 是 Playwright 的
   * option fixture，context 创建时消费它）。打 @guest 标签的场景保持未登录
   * ——登录功能本身的测试必须从干净状态开始。
   */
  storageState: async ({ workerStorageState, $tags }, use) => {
    if ($tags.includes('@guest')) {
      await use(undefined);
    } else {
      await use(workerStorageState);
    }
  },
});

export const { Given, When, Then } = createBdd(test);
