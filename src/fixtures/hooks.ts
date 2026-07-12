import { createBdd } from 'playwright-bdd';
import { baseTest } from './base.fixtures';

/**
 * 场景级/worker 级钩子。
 *
 * 纪律：能用 fixture 表达的不要写成 hook——浏览器生命周期、失败截图/trace、
 * 每场景状态重置都已由 Playwright/config/fixture 承担。hook 只负责两类事：
 *   1. 按标签条件执行的准备（Before + tags）
 *   2. 横切所有场景的收尾（After，如清理场景产生的后端数据）
 *
 * 执行顺序：fixture setup → Before → Background → 步骤 → After → fixture teardown
 * 注意：BeforeAll/AfterAll 是"每个 worker 一次"，不是全局一次。
 */
/* 挂在基座实例上：hook 只用基座 fixtures（ctx/$testInfo），对所有领域的场景生效 */
const { Before, After } = createBdd(baseTest);

/** 标签驱动示例：@mobile 场景切换到手机视口，其余场景不受影响 */
Before({ tags: '@mobile' }, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
});

/** 失败取证增强：场景失败时把 ScenarioContext 附加到报告，便于还原现场 */
After(async ({ ctx, $testInfo }) => {
  if ($testInfo.error) {
    await $testInfo.attach('scenario-context', {
      body: JSON.stringify(ctx, null, 2),
      contentType: 'application/json',
    });
  }
});

/** 数据清理：执行本场景登记过的清理动作（API 造数的配套收尾），成功失败都跑 */
After(async ({ ctx }) => {
  await ctx.runCleanups();
});
