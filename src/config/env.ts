import * as path from 'node:path';
import * as dotenv from 'dotenv';

/**
 * 环境配置加载器。
 *
 * 通过 `ENV` 变量选择环境文件：`ENV=staging npm test` 会加载 `env/.env.staging`。
 * 默认加载 `env/.env.dev`。已存在的进程环境变量优先级高于文件（便于 CI 注入密钥）。
 */
const ENV_NAME = process.env.ENV ?? 'dev';

dotenv.config({
  path: path.resolve(__dirname, `../../env/.env.${ENV_NAME}`),
});

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `缺少必需的环境变量 ${name}（当前环境: ${ENV_NAME}，请检查 env/.env.${ENV_NAME}）`,
    );
  }
  return value;
}

export const env = {
  /** 当前环境名: dev / staging / prod */
  name: ENV_NAME,
  baseUrl: required('BASE_URL'),
  username: required('SAUCE_USERNAME'),
  password: required('SAUCE_PASSWORD'),
} as const;
