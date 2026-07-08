import { test as base } from 'playwright-bdd';
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
 * 场景内跨步骤传递的数据键。基座只定义空集，
 * 各领域 fixtures 通过 declaration merging 注入自己的键：
 *
 *   declare module '../fixtures/base.fixtures' {
 *     interface ScenarioData { tradeId: string }
 *   }
 *
 * 键声明住在领域文件里，但运行时仍是同一个 ctx 对象——
 * 跨领域的数据流（如 tradeId 从交易域流向报表域）不受拆分影响。
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ScenarioData {}

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
 * 基座 fixtures：与具体业务域无关的横切能力。
 * 领域 fixtures（trade/product/...）从 baseTest 继续 extend——
 * playwright-bdd 要求同一 scenario 的步骤来自同一实例或其祖先，
 * 因此领域之间不要互相依赖，只依赖基座。
 */
type BaseFixtures = {
  apiContext: APIRequestContext;
  userApi: UserApi;
  /** 场景内切换登录角色（maker/checker 等），同一浏览器会话、同一套页面对象 */
  loginAs: (username: string) => Promise<void>;
  ctx: ScenarioContext;
};

type WorkerFixtures = {
  workerStorageState: StorageState;
};

export const baseTest = base.extend<BaseFixtures, WorkerFixtures>({
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
   * 真实项目在此处调用登录 API 换 token（用 playwright.request），再组装成
   * cookies/localStorage。多账号隔离时按 workerInfo.parallelIndex 分配账号。
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
