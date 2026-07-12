import { expect } from '@playwright/test';
import { BaseComponent } from '../../components/base.component';

/**
 * 历史事件卡片（trade-detail-history-events-card）。
 * 行 testid 为 history-event-row（同名多个），按数量/文本断言，
 * 与 BlotterView.rows() 同一套建模方式。
 */
export class HistorySection extends BaseComponent {
  private readonly rows = this.host.getByTestId('history-event-row');

  async expectEventCount(count: number): Promise<void> {
    await expect(this.rows).toHaveCount(count);
  }

  /** 假定最新事件排在最上，若为倒序改用 .last() */
  async expectLatestEvent(text: string): Promise<void> {
    await expect(this.rows.first()).toContainText(text);
  }

  async expectHasEvent(text: string): Promise<void> {
    await expect(this.rows.filter({ hasText: text })).toHaveCount(1);
  }
}
