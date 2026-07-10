import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /* CI 上失败重试 1 次，重试时保留 trace 供回放定位 */
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    /* 场景级墙钟时间戳与耗时（日志对账用），不需要时删掉这行即可 */
    ['./src/reporters/timing-reporter.ts'],
    /* 唯一 HTML 报告：test.step 标题即业务语言，工程师与业务方共用 */
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: env.baseUrl,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    testIdAttribute: 'data-test',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* 需要多浏览器时取消注释即可
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    */
  ],
});
