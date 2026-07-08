import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { TradePortalPage } from '../pages/trade-portal/trade-portal.page';
import { TradeDetailPage } from '../pages/trade-detail/trade-detail.page';
import { NewTradePage } from '../pages/new-trade/new-trade.page';
import { LoginFlow } from '../flows/login.flow';
import { TradeFlow } from '../flows/trade.flow';
import { UserApi } from '../api/user.api';
import { env } from '../config/env';
import type { APIRequestContext, BrowserContextOptions } from '@playwright/test';

type StorageState = BrowserContextOptions['storageState'];
type SessionCookie = Exclude<StorageState, string | undefined>['cookies'][number];

/** 构造某账号的会话 cookie（真实项目：改为调登录 API 换 token 后组装） */
function sessionCookiesFor(username: string): SessionCookie[] {
  return [
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
  ];
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
/**
 * 场景内跨步骤传递的数据字段全部在此声明——这是唯一需要维护的地方。
 * 新增一份数据 = 加一行键声明，读写自动获得类型推导与检查。
 */
export interface ScenarioData {
  /** maker 创建交易后从接口响应捕获的 tradeId */
  tradeId: string;
}

export class ScenarioContext {
  private readonly data: Partial<ScenarioData> = {};

  set<K extends keyof ScenarioData>(key: K, value: ScenarioData[K]): void {
    this.data[key] = value;
  }

  /** 数据可能尚未产生时使用（返回 undefined 由调用方处理） */
  get<K extends keyof ScenarioData>(key: K): ScenarioData[K] | undefined {
    return this.data[key];
  }

  /** 断言式读取：未写入时给出可诊断的错误，而非让 undefined 渗透到后续步骤 */
  require<K extends keyof ScenarioData>(key: K): ScenarioData[K] {
    const value = this.data[key];
    if (value === undefined) {
      throw new Error(
        `ctx.${String(key)} is empty — did the step that produces it run before this one?`,
      );
    }
    return value;
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
  tradePortalPage: TradePortalPage;
  tradeDetailPage: TradeDetailPage;
  newTradePage: NewTradePage;
  loginFlow: LoginFlow;
  tradeFlow: TradeFlow;
  apiContext: APIRequestContext;
  userApi: UserApi;
  /** 场景内切换登录角色（maker/checker 等），同一浏览器会话、同一套页面对象 */
  loginAs: (username: string) => Promise<void>;
  ctx: ScenarioContext;
};

type WorkerFixtures = {
  workerStorageState: StorageState;
};

export const test = base.extend<PageFixtures, WorkerFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  tradePortalPage: async ({ page }, use) => use(new TradePortalPage(page)),
  tradeDetailPage: async ({ page }, use) => use(new TradeDetailPage(page)),
  newTradePage: async ({ page }, use) => use(new NewTradePage(page)),
  /* Flow 依赖 Page fixture 组装，同样按场景实例化 */
  loginFlow: async ({ loginPage, inventoryPage }, use) =>
    use(new LoginFlow(loginPage, inventoryPage)),
  tradeFlow: async ({ tradePortalPage, newTradePage }, use) =>
    use(new TradeFlow(tradePortalPage, newTradePage)),
  /* API 造数：独立于浏览器的 HTTP 上下文（可配 API_BASE_URL 与鉴权头） */
  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: env.apiBaseUrl });
    await use(apiContext);
    await apiContext.dispose();
  },
  userApi: async ({ apiContext }, use) => use(new UserApi(apiContext)),
  /**
   * 角色切换：清掉当前会话 cookie，注入目标账号的会话。
   * maker→checker 这类先后操作共用同一浏览器会话与同一 ctx；
   * 若某天真的需要两个角色同时在线（极少见），再临时开第二个 context。
   */
  loginAs: async ({ context }, use) => {
    await use(async (username: string) => {
      await context.clearCookies();
      await context.addCookies(sessionCookiesFor(username));
    });
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
      await use({ cookies: sessionCookiesFor(env.username), origins: [] });
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
