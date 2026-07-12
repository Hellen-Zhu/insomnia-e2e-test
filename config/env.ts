import * as path from 'node:path';
import * as dotenv from 'dotenv';

/**
 * Environment config loader.
 *
 * The `ENV` variable selects the env file: `ENV=staging npm test` loads
 * `env/.env.staging`; default is `env/.env.dev`. Pre-existing process env vars
 * take precedence over the file (so CI can inject secrets).
 */
const ENV_NAME = process.env.ENV ?? 'dev';

dotenv.config({
  path: path.resolve(__dirname, `../env/.env.${ENV_NAME}`),
  /* suppress dotenv's startup banner/ad line in test output */
  quiet: true,
});

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name} (current env: ${ENV_NAME}, check env/.env.${ENV_NAME})`,
    );
  }
  return value;
}

export const env = {
  /** current environment name: dev / staging / prod */
  name: ENV_NAME,
  baseUrl: required('BASE_URL'),
  /** data-seeding API base; falls back to baseUrl when not configured */
  apiBaseUrl: process.env.API_BASE_URL ?? required('BASE_URL'),
} as const;
