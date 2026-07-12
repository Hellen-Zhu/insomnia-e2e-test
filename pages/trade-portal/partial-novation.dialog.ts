import { expect } from '@playwright/test';
import { DynamicActionModal } from '../components/dynamic-action-modal';

/**
 * partial novation 视角下的动态操作弹窗：通用骨架继承 DynamicActionModal，
 * 这里只登记该操作特有的名义金额区。
 * 这两个 testid 缺 dynamic-action 前缀、不守组件语法（已登记反馈前端）——
 * 前端修正前缀后可回归基类的参数化语法，本类即可删除。
 */
export class PartialNovationDialog extends DynamicActionModal {
  private readonly notionalEquation = this.host.getByTestId(
    'partial-novation-notional-equation-value',
  );
  private readonly notionalSummary = this.host.getByTestId(
    'partial-novation-notional-summary-container',
  );

  /** 部分 novation 的名义金额等式（原额 = 转出 + 留存） */
  async expectNotionalEquation(text: string): Promise<void> {
    await expect(this.notionalEquation).toContainText(text);
  }

  async expectNotionalSummaryVisible(): Promise<void> {
    await expect(this.notionalSummary).toBeVisible();
  }
}
