import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';
import { env } from './config/env';

const testDir = defineBddConfig({
  features: 'test/features/**/*.feature',
  /* fixtures must be inside the steps pattern: playwright-bdd discovers the
     exported test instances and hooks from these files */
  steps: ['test/steps/**/*.ts', 'fixtures/**/*.ts'],
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /* retry once on CI; the retry keeps its trace for replay-based diagnosis */
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    /* per-scenario wall-clock timestamps and durations (log reconciliation);
       delete this line if not needed */
    ['./reporters/timing-reporter.ts'],
    /* for engineers: official Playwright report with trace/screenshots */
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
    /* for business readers: Cucumber-format report organized by Feature/Scenario */
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
    /* Agent-only project: seed specs give AI agents (planner/generator) a live
       logged-in page. npm scripts pin --project=chromium so seeds never run in
       normal or CI suites. */
    {
      name: 'seed',
      testDir: './test/seed',
      use: { ...devices['Desktop Chrome'] },
    },
    /* uncomment for cross-browser runs
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    */
  ],
});
