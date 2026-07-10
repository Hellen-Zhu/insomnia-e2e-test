import { test as base } from '@playwright/test';
import { UserApi } from '../api/user.api';
import { env } from '../config/env';
import type { APIRequestContext } from '@playwright/test';

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
 * 基座 fixtures：与浏览器页面无关的横切能力（ctx、API 造数）。
 * 登录相关能力在应用入口层（trade-portal.fixtures），因为它依赖页面对象。
 * 一个 spec 文件只从一个 test 实例导入（取所属业务域的实例），
 * 因此领域之间不要互相依赖，只沿继承链向上依赖。
 */
type BaseFixtures = {
  apiContext: APIRequestContext;
  userApi: UserApi;
  ctx: ScenarioContext;
};

export const baseTest = base.extend<BaseFixtures>({
  /* API 造数：独立于浏览器的 HTTP 上下文（可配 API_BASE_URL 与鉴权头） */
  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: env.apiBaseUrl });
    await use(apiContext);
    await apiContext.dispose();
  },
  userApi: async ({ apiContext }, use) => use(new UserApi(apiContext)),
  /* teardown（use 之后）承担原 BDD 分支 After hooks 的两项横切收尾 */
  ctx: async ({}, use, testInfo) => {
    const ctx = new ScenarioContext();
    await use(ctx);
    /* 失败取证增强：把 ScenarioContext 附加到报告，便于还原现场 */
    if (testInfo.error) {
      await testInfo.attach('scenario-context', {
        body: JSON.stringify(ctx, null, 2),
        contentType: 'application/json',
      });
    }
    /* 数据清理：执行本场景登记过的清理动作（API 造数的配套收尾），成功失败都跑 */
    await ctx.runCleanups();
  },
});
