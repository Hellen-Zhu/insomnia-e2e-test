import { expect, type APIRequestContext } from '@playwright/test';

/**
 * API 造数客户端基类。
 *
 * 定位：只用于测试数据准备/清理（seeding），不做 API 功能测试。
 * 所有请求统一断言 2xx——造数失败必须立刻炸掉场景，而不是让
 * 后续 UI 步骤在残缺数据上跑出难以定位的失败。
 *
 * 需要鉴权时：在 fixtures.ts 创建 apiContext 处传入
 * extraHTTPHeaders: { Authorization: `Bearer ${token}` }，
 * token 建议用 worker 作用域 fixture 获取（每 worker 登录一次）。
 */
export abstract class ApiClient {
  constructor(protected readonly api: APIRequestContext) {}

  protected async getJson<T>(url: string): Promise<T> {
    const response = await this.api.get(url);
    expect(response, `GET ${url} → ${response.status()}`).toBeOK();
    return (await response.json()) as T;
  }

  protected async postJson<T>(url: string, data: unknown): Promise<T> {
    const response = await this.api.post(url, { data });
    expect(response, `POST ${url} → ${response.status()}`).toBeOK();
    return (await response.json()) as T;
  }

  protected async deleteResource(url: string): Promise<void> {
    const response = await this.api.delete(url);
    expect(response, `DELETE ${url} → ${response.status()}`).toBeOK();
  }
}
