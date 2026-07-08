import { ApiClient } from './api-client';

/**
 * 领域造数客户端【模板】——saucedemo 无造数接口，接入真实后端时
 * 按你们的 API 契约调整路径与类型，用法与分层不变。
 * 每个业务域一个文件：user.api.ts / order.api.ts / product.api.ts ...
 */
export interface CreatedUser {
  id: string;
  username: string;
}

export class UserApi extends ApiClient {
  async createUser(user: { username: string; password: string }): Promise<CreatedUser> {
    return this.postJson<CreatedUser>('/api/v1/users', user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.deleteResource(`/api/v1/users/${id}`);
  }
}
