import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * 场景计时 Reporter：向控制台输出每个场景的绝对开始/结束时刻与耗时。
 *
 * 定位：duration 本身 HTML 报告/list reporter 已有，本 Reporter 的增量价值是
 * "墙钟时间戳"——用场景的时间窗到后端日志/APM 做对账，以及产出可被
 * 脚本采集的单行机器可读格式。
 *
 * 计时口径：startTime/duration 由 runner 官方计量（含 Before hook、Background
 * 与场景级 fixture setup），比在 hook 里手动掐表更真实。
 */
export default class TimingReporter implements Reporter {
  onTestBegin(test: TestCase, result: TestResult): void {
    console.log(`[timing] ▶ ${test.title} | start=${iso(result.startTime)}`);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const end = new Date(result.startTime.getTime() + result.duration);
    console.log(
      `[timing] ${result.status === 'passed' ? '✓' : '✗'} ${test.title}` +
        ` | start=${iso(result.startTime)} end=${iso(end)} duration=${result.duration}ms`,
    );
  }

  printsToStdio(): boolean {
    return true;
  }
}

function iso(date: Date): string {
  return date.toISOString();
}
