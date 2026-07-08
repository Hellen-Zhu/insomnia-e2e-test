import { test as base, createBdd } from 'playwright-bdd';
import { UserApi } from '../api/user.api';
import { env } from '../config/env';
import { credentialsFor } from '../config/users';
import type { APIRequestContext, BrowserContextOptions } from '@playwright/test';

type StorageState = BrowserContextOptions['storageState'];
type SessionCookie = Exclude<StorageState, string | undefined>['cookies'][number];

/**
 * 为某角色构建会话 cookie。真实项目：改为调登录 API 换 token 后组装——
 * 这是唯一需要改的地方，loginAs 的签名与所有步骤不动。
 */
function buildSessionFor(role: string): SessionCookie[] {
  const { username } = credentialsFor(role);
  return sessionCookiesFor(username);
}

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
  /** 以角色身份登录/切换角色（maker/checker 等），同一浏览器会话、同一套页面对象 */
  loginAs: (role: string) => Promise<void>;
  ctx: ScenarioContext;
};

type WorkerFixtures = {
  /** 角色 → 会话的 worker 级缓存：每个角色每 worker 只构建一次会话 */
  sessionCache: Map<string, SessionCookie[]>;
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
   * 角色化登录/切换：清掉当前会话 cookie，注入目标角色的会话。
   * 场景不再隐式预注入登录态——需要登录的场景显式声明
   * `Given I am logged in as "maker"`（见 steps/auth.steps.ts）；
   * maker→checker 先后切换共用同一浏览器会话与同一 ctx。
   * 会话构建按角色在 worker 级缓存：真实项目中即"每角色每 worker
   * 只调一次登录 API"，本 worker 后续场景直接复用。
   */
  loginAs: async ({ context, sessionCache }, use) => {
    await use(async (role: string) => {
      let cookies = sessionCache.get(role);
      if (!cookies) {
        cookies = buildSessionFor(role);
        sessionCache.set(role, cookies);
      }
      await context.clearCookies();
      await context.addCookies(cookies);
    });
  },
  ctx: async ({}, use) => use(new ScenarioContext()),

  sessionCache: [
    async ({}, use) => use(new Map<string, SessionCookie[]>()),
    { scope: 'worker' },
  ],
});

/** 基座级步骤定义用（所有领域的场景都可用），如 steps/auth.steps.ts 的角色化登录 */
export const { Given, When, Then } = createBdd(baseTest);
