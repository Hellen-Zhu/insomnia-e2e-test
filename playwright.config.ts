import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';
import { env } from './config/env';

const testDir = defineBddConfig({
  features: 'test/features/**/*.feature',
  /* fixtures 必须在 steps pattern 内：playwright-bdd 从中识别导出的 test 实例与 hooks */
  steps: ['test/steps/**/*.ts', 'fixtures/**/*.ts'],
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /* CI 上失败重试 1 次，重试时保留 trace 供回放定位 */
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    /* 场景级墙钟时间戳与耗时（日志对账用），不需要时删掉这行即可 */
    ['./reporters/timing-reporter.ts'],
    /* 工程师用：Playwright 官方报告，含 trace/截图 */
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
    /* 业务方用：Cucumber 格式报告，按 Feature/Scenario 组织 */
    cucumberReporter('html', { outputFile: 'reports/cucumber-report.html' }),
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
