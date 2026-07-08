import { expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { BasicInfoSection } from './basic-info.section';
import { InstrumentSection } from './instrument.section';
import { ScheduleSection } from './schedule.section';
import { HistorySection } from './history.section';
import {
  CancelTradeDialog,
  CheckerConfirmDialog,
  type CancellationDetails,
} from './trade-detail.dialogs';

/**
 * Trade Detail 页面。
 *
 * 30 条元素清单收敛为：4 个 Section + 2 个 Dialog + 页面级动作按钮。
 * 通常从 blotter 行的 view-details 进入而非直接 open()，
 * path 仅用于 expectOpened() 的 URL 断言（按真实路由调整）。
 *
 * approve/reject/cancelTrade 均为原子业务动作：弹窗的存在
 * 是页面对象的实现细节，step 层不感知。
 */
export class TradeDetailPage extends BasePage {
  readonly path = '/trade-detail';

  private readonly container = this.page.getByTestId('trade-detail-container');

  readonly basicInfo = new BasicInfoSection(
    this.page.getByTestId('trade-detail-basic-info-card'),
  );
  readonly instrument = new InstrumentSection(
    this.page.getByTestId('instrument-tree-container'),
  );
  readonly schedule = new ScheduleSection(
    this.page.getByTestId('trade-detail-schedule-section'),
  );
  readonly history = new HistorySection(
    this.page.getByTestId('trade-detail-history-events-card'),
  );

  private readonly cancelDialog = new CancelTradeDialog(
    this.page.getByTestId('trade-detail-cancel-dialog'),
  );
  private readonly checkerDialog = new CheckerConfirmDialog(
    this.page.getByTestId('trade-detail-confirm-checker-action-dialog'),
  );

  /** checker 才可见的操作区，用于断言角色权限 */
  private readonly actionsContainer = this.page.getByTestId('trade-detail-actions');
  private readonly statusBadge = this.page.getByTestId('trade-detail-status-badge');

  private btn(name: string) {
    return this.page.getByTestId(`trade-detail-${name}-btn`);
  }

  /* ---------- maker 动作 ---------- */

  async save(): Promise<void> {
    await this.btn('save').click();
  }

  async skipRiskCheck(): Promise<void> {
    await this.btn('skip-risk').click();
  }

  /** 打开取消弹窗并完成整个取消流程 */
  async cancelTrade(details: CancellationDetails): Promise<void> {
    await this.btn('cancel').click();
    await this.cancelDialog.cancelWith(details);
  }

  /* ---------- checker 动作（approve/reject 共用确认弹窗） ---------- */

  async approve(): Promise<void> {
    await this.btn('approve').click();
    await this.checkerDialog.confirm();
  }

  async reject(): Promise<void> {
    await this.btn('reject').click();
    await this.checkerDialog.confirm();
  }

  async expectCheckerActionsVisible(): Promise<void> {
    await expect(this.actionsContainer).toBeVisible();
  }

  /* ---------- 导航与断言 ---------- */

  async goBack(): Promise<void> {
    await this.page.getByTestId('trade-detail-page-back-btn').click();
  }

  async expectStatus(status: string): Promise<void> {
    await expect(this.statusBadge).toHaveText(status);
  }

  /**
   * 日期展示单元格。原清单用 CSS（p.text-lg）定位——依赖 Tailwind
   * 类名，样式一改就碎。此处保留等价实现，建议让前端补 testid。
   */
  dateCells() {
    return this.container.locator('p.text-lg');
  }
}
